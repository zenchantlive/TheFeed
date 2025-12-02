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

  console.log(`[Tavily] Searching for: ${resource.name}`);
  console.log(`[Tavily] Query: ${query}`);

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
  console.log(`[Tavily] Found ${data.results?.length || 0} results`);
  if (data.results?.length > 0) {
    console.log(`[Tavily] First result: ${data.results[0].title} - ${data.results[0].url}`);
  }
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

  // Use Claude Haiku 4.5 specifically for web search (web_search_options requires Anthropic models)
  const model = "anthropic/claude-haiku-4.5";
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new EnhancementError("OpenRouter API key missing from configuration", 500);
  }

  const focusInstruction = focusField
    ? `Focus primarily on finding and confirming the "${focusField}" field.`
    : "Focus on finding any missing or incomplete details.";

  console.log(`[Enhancement] Using Claude with native web search for: ${resource.name}`);

  // Define the schema for response validation
  const responseSchema = z.object({
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
  });

  const prompt = `
      You are an expert data analyst verifying food bank information. You have web search enabled - use it to find current, accurate information.

      SEARCH QUERY TO USE:
      "${resource.name}" food bank ${resource.city} ${resource.state} hours phone website services

      RESOURCE TO VERIFY:
      Name: ${resource.name}
      Address: ${resource.address}, ${resource.city}, ${resource.state}
      Current Phone: ${resource.phone ?? "Unknown"}
      Current Website: ${resource.website ?? "Unknown"}

      CRITICAL RULES:
      1. **Use web search** to find the official website and current information for this specific food bank
      2. IGNORE non-food services. If the entity is a church, do NOT extract Sunday Worship hours or Office hours. Look ONLY for "Food Pantry", "Food Distribution", or "Soup Kitchen" hours
      3. If you cannot find specific food distribution hours, leave 'hours' as null. Do NOT guess office hours
      4. Verify the address matches before extracting data (avoid similar-named organizations in the same city)
      5. Return structured data matching the schema exactly
      6. Include the URLs you found in the 'sources' array

      TASK: ${focusInstruction}

      EXTRACT AND RETURN:
      - phone: Phone number for the food pantry/distribution program (not general church office)
      - website: Official website URL
      - description: Brief description of services offered (focus on food assistance)
      - services: Array of services (e.g., ["Food Pantry", "Hot Meals", "Emergency Food"])
      - raw_hours: The raw text description of FOOD PANTRY hours (e.g. 'Mon-Fri 9am-12pm')
      - hours: Structured hours object with all 7 days (monday through sunday)
        Each day should be { open: "HH:MM", close: "HH:MM", closed: boolean } or null
      - summary: Brief summary of what you found and confidence level (explain if you couldn't find something)
      - confidence: 0.0 to 1.0 (Low if uncertain or no web results, high if confirmed from official sources)
      - sources: Array of URLs where you found this information (empty array if no results)

      Return ONLY a JSON object matching this schema, no markdown formatting:
      {
        "updates": {
          "phone": "string or null",
          "website": "string or null",
          "description": "string or null",
          "services": ["array", "of", "strings"] or null,
          "raw_hours": "string or null",
          "hours": { "monday": { "open": "HH:MM", "close": "HH:MM" }, ... } or null
        },
        "summary": "string",
        "confidence": 0.0,
        "sources": ["https://url1.com", "https://url2.com"]
      }
    `;

  // Direct API call to OpenRouter with plugins
  console.log("[Enhancement] Making direct OpenRouter API call with web search plugin");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openrouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "TheFeed Admin Enhancement",
    },
    body: JSON.stringify({
      model,
      plugins: [
        {
          id: "web",
          engine: "native",
          max_results: 5,
        },
      ],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Enhancement] OpenRouter API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new EnhancementError(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  console.log("[Enhancement] OpenRouter response received:", {
    model: data.model,
    usage: data.usage,
  });

  // Extract the JSON from the response
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new EnhancementError("No content in OpenRouter response", 500);
  }

  // Extract JSON from potential markdown code blocks or plain text
  let jsonString = content.trim();

  // Remove markdown code blocks if present
  const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
    console.log("[Enhancement] Extracted JSON from markdown code block");
  }

  // Try to find JSON object if there's extra text
  if (!jsonString.startsWith('{')) {
    const jsonMatch = jsonString.match(/\{[\s\S]*?\}$/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
      console.log("[Enhancement] Extracted JSON object from text");
    }
  }

  // Parse and validate the JSON response
  let parsedContent;
  try {
    parsedContent = JSON.parse(jsonString);
  } catch (err) {
    console.error("[Enhancement] Failed to parse JSON response. Raw content:", content);
    console.error("[Enhancement] Extracted string:", jsonString);
    console.error("[Enhancement] Parse error:", err);
    throw new EnhancementError("Invalid JSON response from AI", 500);
  }

  // Validate against schema
  const object = responseSchema.parse(parsedContent);

  const updates = object.updates || {};
  const normalizedHours = updates.hours ? normalizeHours(updates.hours).hours : null;
  const normalizedServices = normalizeServices(updates.services || []);
  const normalizedPhone = normalizePhone(updates.phone);
  const normalizedWebsite = normalizeWebsite(updates.website);

  console.log(`[Enhancement] Claude found confidence: ${object.confidence}, sources: ${object.sources?.length || 0}`);

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
    sources: object.sources || [],
    focusField: focusField ?? null,
    rawHours: updates.raw_hours ?? null,
  };
}
