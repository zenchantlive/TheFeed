import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import { generateObject } from "ai";
import { db } from "./db";
import { foodBanks, type HoursType } from "./schema";

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
  const query = `${resource.name} ${locationContext || "Sacramento, CA"} hours phone services`;

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_raw_content: true,
    }),
  });

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

const enhancementSchema = z.object({
  summary: z.string().describe("Human readable summary of any updates found."),
  confidence: z.number().min(0).max(1),
  updates: z
    .object({
      phone: z.string().nullable(),
      website: z.string().nullable(),
      description: z.string().nullable(),
      services: z.array(z.string()).nullable(),
      hours: z.string().nullable(),
    })
    .nullable()
    .describe("Proposed updates. Return null for any field if no new info found."),
});

function truncateContent(results: TavilyResult[]): { content: string; sources: string[] } {
  const top = results.slice(0, 3);
  const content = top
    .map((result) => {
      const body = result.raw_content || result.content || "";
      const truncated = body.slice(0, 4000);
      return `Source: ${result.url}\n${truncated}`;
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

  const { object } = await generateObject({
    model: openrouter(model),
    schema: enhancementSchema,
    prompt: `
      You are an assistant that fills in missing structured data for community resources.
      We have the following existing information:

      Name: ${resource.name}
      Address: ${resource.address}, ${resource.city}, ${resource.state} ${resource.zipCode}
      Phone: ${resource.phone ?? "Unknown"}
      Website: ${resource.website ?? "Unknown"}
      Description: ${resource.description ?? "Unknown"}

      Review the documents below and extract updated details if they are clearly stated.
      ${focusInstruction}
      Only provide fields when the information is explicit and confident.

      Documents:
      ${content}
    `,
  });

  const updates = object.updates || {
    phone: null,
    website: null,
    description: null,
    services: null,
    hours: null,
  };

  return {
    resourceId,
    proposed: {
      phone: updates.phone ?? null,
      website: updates.website ?? null,
      description: updates.description ?? null,
      services: updates.services ?? null,
      hours: normalizeHours(updates.hours),
    },
    summary: object.summary,
    confidence: object.confidence,
    sources,
    focusField: focusField ?? null,
  };
}

function normalizeHours(raw?: string | null): HoursType | null {
  if (!raw) return null;
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const normalized: HoursType = {};
  for (const line of lines) {
    const [dayPart, hoursPart] = line.split(":").map((part) => part?.trim());
    if (!dayPart || !hoursPart) continue;
    if (/closed/i.test(hoursPart)) {
      normalized[dayPart] = { open: "Closed", close: "Closed", closed: true };
      continue;
    }
    const [open, close] = hoursPart.split("-").map((part) => part?.trim());
    if (!open || !close) continue;
    normalized[dayPart] = { open, close };
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}
