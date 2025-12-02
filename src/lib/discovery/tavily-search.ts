/**
 * Tavily Search Wrapper
 *
 * This module interfaces with the Tavily API to perform semantic searches for food resources.
 * It handles the raw API communication and initial parsing of results.
 *
 * @see https://tavily.com/
 */

import { type DiscoveryResult, type TavilyResponse, type TavilySearchResult } from "./types";
import { generateObject } from "ai";
import { z } from "zod";
import { openrouter } from "@openrouter/ai-sdk-provider";
import {
  normalizeHours,
  normalizeResource,
  normalizeServices,
  getAddressFingerprint,
  isTrustedSource
} from "../resource-normalizer";
import { geocodeAddress } from "../server-geocoding";
import { withTimeout } from "../timeout";

const TAVILY_API_URL = "https://api.tavily.com/search";

export class DiscoveryConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscoveryConfigError";
  }
}

export interface ProgressUpdate {
  stage: "searching" | "processing" | "deduplicating";
  current?: number;
  total?: number;
  message: string;
}

/**
 * Fetches Tavily API with retry logic and timeout handling
 */
async function fetchTavilyWithRetry(
  query: string,
  maxRetries = 3
): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new DiscoveryConfigError("TAVILY_API_KEY is not set in environment variables.");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await withTimeout(
        fetch(TAVILY_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: "advanced",
            include_answer: true,
            max_results: 20,
            include_raw_content: true,
          }),
        }),
        30000, // 30 second timeout per attempt
        "Tavily API request timed out"
      );

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`Tavily rate limited, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }

        throw new Error(`Tavily API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Tavily attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt === maxRetries) break;

      // Retry delay
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error(`Tavily API failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Performs a targeted search for food resources in a specific area.
 *
 * @param city - The city to search in (e.g., "Sacramento")
 * @param state - The state code (e.g., "CA")
 * @param onProgress - Optional callback for status updates
 * @returns A list of potential discovery results (unverified)
 */
export async function searchResourcesInArea(
  city: string,
  state: string,
  onProgress?: (update: ProgressUpdate) => void
): Promise<DiscoveryResult[]> {
  // Construct a specific query to get relevant results
  const query = `food banks, food pantries, and free community meals in ${city}, ${state} with address and hours`;

  try {
    onProgress?.({ stage: "searching", message: `Searching Tavily for resources in ${city}...` });

    const data = await fetchTavilyWithRetry(query);
    const rawResults = data.results || [];

    onProgress?.({
      stage: "processing",
      message: `Found ${rawResults.length} potential resources, processing...`,
    });

    // Process results in batches to avoid timeouts and handle large documents
    return await processBatchResults(rawResults, city, state, onProgress);
  } catch (error) {
    if (error instanceof DiscoveryConfigError) {
      console.error("Discovery configuration error:", error.message);
      throw error;
    }
    console.error("Error in searchResourcesInArea:", error);
    throw error; // Let caller handle error properly
  }
}

/**
 * Processes search results in small concurrent batches.
 * Extracts full content from rich documents (PDFs/Lists) individually.
 */
async function processBatchResults(
  rawResults: TavilySearchResult[],
  city: string,
  state: string,
  onProgress?: (update: ProgressUpdate) => void
): Promise<DiscoveryResult[]> {
  if (!rawResults || rawResults.length === 0) return [];

  const BATCH_SIZE = 3; // Process 3 documents at a time to respect rate limits/timeouts
  const totalBatches = Math.ceil(rawResults.length / BATCH_SIZE);
  const allExtractedResources: DiscoveryResult[] = [];
  const geocodingFailures: { resource: DiscoveryResult; reason: string }[] = [];

  // Helper to process a single search result
  const processResult = async (result: TavilySearchResult): Promise<DiscoveryResult[]> => {
    // Use raw content if available, otherwise fallback to snippet
    // Truncate to ~20k chars to stay within typical token limits while capturing most PDF content
    const contentToAnalyze = (result.raw_content || result.content).slice(0, 20000);

    try {
      const extracted = await extractResourcesFromContent(contentToAnalyze, result.url, city, state);

      // Geocode immediately to help with deduplication
      const geocoded = await Promise.all(extracted.map(async (res) => {
        // Skip if address is clearly invalid
        if (!res.address || res.address.length < 5) {
          geocodingFailures.push({
            resource: res,
            reason: "Invalid address (too short)"
          });
          return null;
        }

        // Validate coordinates - skip resources with (0,0) or missing coords
        if (res.latitude === 0 && res.longitude === 0) {
          const coords = await geocodeAddress(res.address, city, state);

          if (coords && coords.latitude !== 0 && coords.longitude !== 0) {
            return { ...res, latitude: coords.latitude, longitude: coords.longitude };
          }

          // Log failure and skip this resource
          geocodingFailures.push({
            resource: res,
            reason: coords ? "Geocoding returned (0,0)" : "Geocoding failed"
          });

          console.warn(`Skipping resource due to geocoding failure: ${res.name}`, {
            address: res.address,
            city: res.city,
            state: res.state,
            reason: coords ? "Geocoding returned (0,0)" : "Geocoding failed"
          });

          return null; // Skip this resource
        }

        return res;
      }));

      // Filter out null results (geocoding failures)
      return geocoded.filter((r): r is DiscoveryResult => r !== null);
    } catch (err) {
      if (err instanceof DiscoveryConfigError) {
        throw err;
      }
      console.warn(`Failed to process ${result.url}:`, err);
      return [];
    }
  };

  // Process in chunks
  for (let i = 0; i < rawResults.length; i += BATCH_SIZE) {
    const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
    const batch = rawResults.slice(i, i + BATCH_SIZE);

    onProgress?.({
      stage: "processing",
      current: currentBatch,
      total: totalBatches,
      message: `Analyzing documents (Batch ${currentBatch}/${totalBatches})... Found ${allExtractedResources.length} resources (${geocodingFailures.length} skipped).`
    });

    console.log(`Processing batch ${currentBatch}/${totalBatches}...`);

    const batchResults = await Promise.all(batch.map(processResult));
    batchResults.flat().forEach(r => allExtractedResources.push(r));
  }

  // Log summary of failures for admin review
  if (geocodingFailures.length > 0) {
    console.info(`Geocoding failures summary:`, {
      total: geocodingFailures.length,
      examples: geocodingFailures.slice(0, 5).map(f => ({
        name: f.resource.name,
        address: `${f.resource.address}, ${f.resource.city}, ${f.resource.state}`,
        reason: f.reason
      }))
    });
  }

  onProgress?.({ stage: "deduplicating", message: "Removing duplicates..." });
  return deduplicateResults(allExtractedResources);
}

/**
 * Core extraction logic for a single document/content block.
 */
async function extractResourcesFromContent(
  content: string,
  sourceUrl: string,
  city: string,
  state: string
): Promise<DiscoveryResult[]> {
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    throw new DiscoveryConfigError("OPENROUTER_API_KEY is not set in environment variables.");
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const { object } = await generateObject({
    model: openrouter(model),
    schema: z.object({
      resources: z.array(
        z.object({
          name: z.string().describe("The official name of the food bank or pantry. Use proper capitalization."),
          address: z.string().describe("The street address. Do not include city/state/zip if possible."),
          city: z.string().describe("The city this specific resource is located in."),
          state: z.string().describe("The 2-letter state code."),
          zipCode: z.string().describe("5-digit zip code"),
          phone: z.string().nullable().describe("Phone number if available, or null"),
          website: z.string().nullable().describe("Official website URL, or null"),
          description: z
            .string()
            .nullable()
            .describe("Short summary of services, or null"),
          services: z
            .array(z.string())
            .describe("List of specific services e.g. 'Hot Meal', 'Pantry'"),
          confidence: z.number().min(0).max(1).describe("Confidence score (0.0-1.0) based on data completeness (has hours/phone) and recency."),
          hours: z
            .object({
              monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
              tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
              wednesday: z
                .object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) })
                .nullable(),
              thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
              friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
              saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
              sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().default(false) }).nullable(),
            })
            .nullable()
            .describe("Operating hours ONLY if explicitly stated for this location. Do NOT guess. Set to null if unknown."),
        })
      ),
    }),
    prompt: `
      Analyze this text from a webpage/document (${sourceUrl}) for "food banks in ${city}, ${state}".
      
      Context:
      - Current Date: ${currentDate}
      - Target Location: ${city}, ${state}

      Content:
      "${content}"

      Goals:
      1. Extract ALL food banks, pantries, or soup kitchens listed in this text.
      2. IGNORE outdated information (e.g., schedules from previous years) unless it's clearly still valid.
      3. IGNORE generic entries or "Call for details" listings unless you have a specific address.
      4. DO NOT GUESS HOURS. If exact hours are not explicitly listed for this specific location, return null.
      5. STANDARDIZE NAMES. Use the official organization name (e.g., "River City Food Bank") rather than "Distribution Site A".
      6. Confidence Scoring:
         - 0.9+: Complete info (Hours, Phone, Address) from an official-looking source.
         - 0.5-0.8: Good info but missing hours or phone.
         - <0.5: Sketchy or very incomplete.
    `,
  });

  return object.resources
    .map((res) => ({
      ...res,
      latitude: 0,
      longitude: 0,
      sourceUrl, // All extracted items share the source document URL
      phone: res.phone ?? undefined,
      website: res.website ?? undefined,
      description: res.description ?? undefined,
      hours: res.hours ? normalizeHours(res.hours).hours ?? undefined : undefined,
      services: normalizeServices(res.services ?? []),
    }))
    .filter(
      (res) =>
        res.name &&
        res.address &&
        res.zipCode &&
        res.city &&
        res.state &&
        // Strict location check: City must roughly match target (e.g. Sacramento ≈ West Sacramento)
        res.city.toLowerCase().includes(city.toLowerCase()) &&
        res.state.toLowerCase() === state.toLowerCase()
    )
    .map((res) => {
      const normalized = normalizeResource({
        ...res,
        services: res.services ?? [],
        hours: res.hours ?? null,
        sourceUrl,
      });

      return {
        ...normalized,
        phone: normalized.phone ?? undefined,
        website: normalized.website ?? undefined,
        description: normalized.description ?? undefined,
        confidence: normalized.confidence ?? 0.5,
        hours: normalized.hours ?? undefined,
        sourceUrl: normalized.sourceUrl ?? sourceUrl,
      };
    });
}

/**
 * Removes duplicates based on normalized Address + Zip, or fuzzy Name match.
 * Merges data to keep the best fields.
 */
function deduplicateResults(results: DiscoveryResult[]): DiscoveryResult[] {
  const merged = new Map<string, DiscoveryResult>();

  for (const res of results) {
    // Create a robust key based on location (Address + Zip)
    // Fallback to Name + Zip if address is weird
    const addressKey = getAddressFingerprint(res.address);
    const zipKey = res.zipCode.trim();

    // Primary Key: Address + Zip (Very strong signal)
    let key: string;

    if (addressKey && addressKey.length >= 5) {
      key = `${addressKey}|${zipKey}`;
    }
    // Secondary Key: Lat/Lng (if available and precise)
    else if (res.latitude && res.longitude && res.latitude !== 0) {
      // Round to ~11m precision to catch slightly different geocodes
      key = `geo:${res.latitude.toFixed(4)},${res.longitude.toFixed(4)}`;
    } else {
      // Fallback: Name + Zip (Weaker but handles missing street numbers)
      key = `name:${getAddressFingerprint(res.name)}|${zipKey}`;
    }

    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, res);
      continue;
    }

    // MERGE LOGIC: Keep the best data
    const isResTrusted = isTrustedSource(res.sourceUrl);
    const isExistingTrusted = isTrustedSource(existing.sourceUrl);

    // Prefer trusted source, then higher confidence
    const preferNew = (isResTrusted && !isExistingTrusted) ||
      (!isExistingTrusted && res.confidence > existing.confidence);

    const target = preferNew ? res : existing;
    const source = preferNew ? existing : res;

    // Merge missing fields from 'source' into 'target'
    merged.set(key, {
      ...target,
      phone: target.phone || source.phone,
      website: target.website || source.website,
      description: (target.description && target.description.length > (source.description?.length || 0))
        ? target.description
        : source.description,
      services: Array.from(new Set([...target.services, ...source.services])),
      hours: target.hours || source.hours, // Keep existing hours if target has them, else take source
      confidence: Math.max(target.confidence, source.confidence) // Boost confidence if confirmed by multiple
    });
  }

  return Array.from(merged.values());
}
