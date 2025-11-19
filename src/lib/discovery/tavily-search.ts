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

const TAVILY_API_URL = "https://api.tavily.com/search";

export interface ProgressUpdate {
  stage: "searching" | "processing" | "deduplicating";
  current?: number;
  total?: number;
  message: string;
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
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set in environment variables.");
  }

  // Construct a specific query to get relevant results
  const query = `food banks, food pantries, and free community meals in ${city}, ${state} with address and hours`;

  try {
    onProgress?.({ stage: "searching", message: `Searching Tavily for resources in ${city}...` });

    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced", // Go deeper to find details
        include_answer: true, // Get a summary if possible
        max_results: 20, // Maximize discovery
        include_raw_content: true, // Get full text to parse lists/PDFs
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Tavily API Error: ${response.status} - ${errorBody}`);
      throw new Error(`Tavily search failed with status ${response.status}`);
    }

    const data: TavilyResponse = await response.json();

    // Process results in batches to avoid timeouts and handle large documents
    return await processBatchResults(data.results, city, state, onProgress);
  } catch (error) {
    console.error("Error in searchResourcesInArea:", error);
    return []; // Return empty on failure to be graceful
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

  // Helper to process a single search result
  const processResult = async (result: TavilySearchResult): Promise<DiscoveryResult[]> => {
    // Use raw content if available, otherwise fallback to snippet
    // Truncate to ~20k chars to stay within typical token limits while capturing most PDF content
    const contentToAnalyze = (result.raw_content || result.content).slice(0, 20000);
    
    try {
      return await extractResourcesFromContent(contentToAnalyze, result.url, city, state);
    } catch (err) {
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
      message: `Analyzing documents (Batch ${currentBatch}/${totalBatches})... Found ${allExtractedResources.length} resources so far.`
    });

    console.log(`Processing batch ${currentBatch}/${totalBatches}...`);
    
    const batchResults = await Promise.all(batch.map(processResult));
    batchResults.flat().forEach(r => allExtractedResources.push(r));
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

  const { object } = await generateObject({
    model: openrouter(model),
    schema: z.object({
      resources: z.array(
        z.object({
          name: z.string().describe("The official name of the food bank or pantry"),
          address: z.string().describe("The street address"),
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
          hours: z
            .object({
              Monday: z.object({ open: z.string(), close: z.string() }).nullable(),
              Tuesday: z.object({ open: z.string(), close: z.string() }).nullable(),
              Wednesday: z
                .object({ open: z.string(), close: z.string() })
                .nullable(),
              Thursday: z.object({ open: z.string(), close: z.string() }).nullable(),
              Friday: z.object({ open: z.string(), close: z.string() }).nullable(),
              Saturday: z.object({ open: z.string(), close: z.string() }).nullable(),
              Sunday: z.object({ open: z.string(), close: z.string() }).nullable(),
            })
            .nullable()
            .describe("Operating hours if clearly stated. Set to null if unknown."),
        })
      ),
    }),
    prompt: `
      Analyze this text from a webpage/document (${sourceUrl}) for "food banks in ${city}, ${state}".
      
      Content:
      "${content}"

      Goals:
      1. Extract ALL food banks, pantries, or soup kitchens listed in this text.
      2. If this is a directory or list, extract EVERY valid entry.
      3. Ignore entries clearly outside of ${city}, ${state} unless they serve the area.
      4. Ignore general info/blogs, look for specific location details (Name + Address).
    `,
  });

  return object.resources.map((res) => ({
    ...res,
    city,
    state,
    latitude: 0,
    longitude: 0,
    confidence: 0.8,
    sourceUrl, // All extracted items share the source document URL
    phone: res.phone ?? undefined,
    website: res.website ?? undefined,
    description: res.description ?? undefined,
    hours: res.hours ? Object.fromEntries(
      Object.entries(res.hours).map(([k, v]) => [k, v ?? undefined])
    ) as any : undefined, 
  }));
}

/**
 * Removes duplicates based on normalized Name + Address key.
 */
function deduplicateResults(results: DiscoveryResult[]): DiscoveryResult[] {
  const seen = new Set<string>();
  return results.filter(res => {
    // Create a simple normalization key
    const key = `${res.name.toLowerCase().trim()}|${res.address.toLowerCase().trim().split(' ')[0]}`; // Name + Street Num
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
