import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "./db";
import { foodBanks, type HoursType } from "./schema";
import { normalizeHours, normalizePhone, normalizeServices, normalizeWebsite } from "./resource-normalizer";

const TAVILY_API_URL = "https://api.tavily.com/search";

export class EnhancementError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EnhancementError";
    this.status = status;
  }
}

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
};

type TavilyResponse = {
  results: TavilyResult[];
};

export type EnhancementProposal = {
  resourceId: string;
  proposed: {
    phone?: string | null;
    website?: string | null;
    description?: string | null;
    services?: string[] | null;
    hours?: HoursType | null;
  };
  summary: string;
  confidence: number;
  sources: string[];
  focusField?: string | null;
  rawHours?: string | null;
};

async function fetchResource(resourceId: string) {
  const record = await db.query.foodBanks.findFirst({
    where: (f, { eq }) => eq(f.id, resourceId),
  });

  if (!record) {
    throw new EnhancementError("Resource not found", 404);
  }

  return record;
}

async function searchResourceDocuments(resource: typeof foodBanks.$inferSelect) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new EnhancementError("Tavily API key missing from configuration", 500);
  }

  const locationContext = [
    resource.address,
    resource.city,
    resource.state,
  ]
    .filter(Boolean)
    .join(", ");
  
  // Improved query: strictly look for food-related services to avoid church/childcare confusion
  const query = `"${resource.name}" "food pantry" OR "food bank" OR "soup kitchen" OR "food distribution" hours services ${locationContext || "Sacramento, CA"}`;

  const fetchWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const res = await fetch(TAVILY_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            search_depth: "basic",
            max_results: 5,
            include_raw_content: true,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) return res;
        
        // If 429 or 5xx, retry. If 400, fail.
        if (res.status === 429 || res.status >= 500) {
          console.warn(`Tavily fetch failed (attempt ${i + 1}/${retries}): ${res.status}`);
          if (i === retries - 1) return res;
        } else {
          return res; // Fatal client error
        }
      } catch (err) {
        console.warn(`Tavily fetch error (attempt ${i + 1}/${retries}):`, err);
        if (i === retries - 1) throw err;
      }
      await new Promise((r) => setTimeout(r, delay * (i + 1))); // Exponential backoff
    }
    throw new Error("Max retries reached");
  };

  const response = await fetchWithRetry();

  if (!response.ok) {
    console.error("Tavily enhancement error", {
      status: response.status,
      statusText: response.statusText,
    });
    throw new EnhancementError("Failed to search for this resource", response.status);
  }

  const data = (await response.json()) as TavilyResponse;
  return data.results ?? [];
}

function truncateContent(results: TavilyResult[]): { content: string; sources: string[] } {
  const top = results.slice(0, 3);
  const content = top
    .map((result) => {
      const body = result.raw_content || result.content || "";
      const truncated = body.slice(0, 4000);
      return `Source: ${result.url}\nTitle: ${result.title}\n${truncated}`;
    })
    .join("\n\n---\n\n");

  const sources = top.map((result) => result.url).filter(Boolean);
  return { content, sources };
}

export async function enhanceResource(
  resourceId: string,
  focusField?: string | null
): Promise<EnhancementProposal> {
  const resource = await fetchResource(resourceId);
  const documents = await searchResourceDocuments(resource);
  if (!documents.length) {
    throw new EnhancementError("No additional information found for this resource", 404);
  }

  const { content, sources } = truncateContent(documents);

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new EnhancementError("OpenRouter API key missing from configuration", 500);
  }

  const focusInstruction = focusField
    ? `Focus primarily on confirming or updating the "${focusField}" field.`
    : "Focus on any missing or incomplete details.";

  // Use generateObject with Zod schema for type-safe structured output
  const { object } = await generateObject({
    model: openrouter(model),
    schema: z.object({
      updates: z.object({
        phone: z.string().nullable().optional(),
        website: z.string().url().nullable().optional(),
        description: z.string().nullable().optional(),
        services: z.array(z.string()).nullable().optional(),
        raw_hours: z.string().nullable().optional(),
        hours: z.record(z.string(), z.object({
          open: z.string(),
          close: z.string(),
          closed: z.boolean().optional()
        }).nullable()).nullable().optional()
      }),
      summary: z.string(),
      confidence: z.number().min(0).max(1),
      sources: z.array(z.string().url()).optional()
    }),
    prompt: `
      You are an expert data analyst verifying food bank information.

      Goal: Extract specific contact info and operating hours for the "Food Pantry" or "Food Distribution" service.

      CRITICAL RULES:
      1. IGNORE non-food services. If the entity is a church, do NOT extract Sunday Worship hours or Office hours. Look ONLY for "Pantry", "Distribution", "Soup Kitchen".
      2. If you cannot find specific food distribution hours, leave 'hours' as null. Do NOT guess office hours.
      3. Return structured data matching the schema exactly.

      Current Data:
      Name: ${resource.name}
      Address: ${resource.address}, ${resource.city}, ${resource.state}
      Phone: ${resource.phone ?? "Unknown"}

      Instructions:
      - Extract phone, website, description, and services if found
      - raw_hours: The raw text description of hours found (e.g. 'Mon-Fri 9am-12pm')
      - hours: Structured hours object with all 7 days (monday through sunday)
        Each day should be { open: "HH:MM", close: "HH:MM", closed: boolean } or null
      - summary: Brief human-readable summary of what you found
      - confidence: 0.0 to 1.0 (Low confidence if only office hours found, high if food pantry hours confirmed)

      Documents:
      ${content}

      ${focusInstruction}
    `,
    temperature: 0.3, // Add for consistency as recommended in plan
  });

  const updates = object.updates || {};
  const normalizedHours = updates.hours ? normalizeHours(updates.hours).hours : null;
  const normalizedServices = normalizeServices(updates.services || []);
  const normalizedPhone = normalizePhone(updates.phone);
  const normalizedWebsite = normalizeWebsite(updates.website);

  return {
    resourceId,
    proposed: {
      phone: normalizedPhone,
      website: normalizedWebsite,
      description: updates.description ?? null,
      services: normalizedServices ?? null,
      hours: normalizedHours ?? null,
    },
    summary: object.summary || "AI enhancement complete.",
    confidence: object.confidence || 0.5,
    sources,
    focusField: focusField ?? null,
    rawHours: updates.raw_hours ?? null,
  };
}
