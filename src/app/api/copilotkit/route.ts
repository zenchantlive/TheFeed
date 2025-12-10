import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import type { NextRequest } from "next/server";
// schema imports removed as they are no longer used directly in this file
import { sousChefTools } from "@/lib/ai-tools";
import { convertVercelToolsToCopilotActions } from "@/lib/copilot-adapter";



/**
 * CopilotKit API endpoint for TheFeed AI Sous-Chef.
 * Uses OpenRouter for model access (configured via OpenAI-compatible client).
 */
// For now, use default OpenAI adapter without custom client
// TODO: Fix OpenRouter integration - the beta.chat.completions API doesn't work with custom baseURL
const serviceAdapter = new OpenAIAdapter({
  model: process.env.OPENAI_MODEL || "gpt-4o",
});

export async function POST(req: NextRequest) {
  // Get session user if no explicit userId header


  // Note: System instructions are handled in the frontend via CopilotChat instructions prop

  // Define CopilotKit actions (converted from Vercel AI SDK tools)
  const runtime = new CopilotRuntime({
    actions: convertVercelToolsToCopilotActions(sousChefTools),
  });

  // Create the endpoint handler
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}
