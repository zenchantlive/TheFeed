/**
 * CLI smoke test for sousChefTools.
 * Run via: pnpm exec tsx --env-file=.env scripts/test-chat-tools.ts
 */

import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { sousChefTools } from "../src/lib/ai-tools";
import { buildSousChefSystemPrompt } from "../src/lib/prompts/chat-system";

type Scenario = {
  name: string;
  prompt: string;
  expectedTool: keyof typeof sousChefTools;
};

const mockLocation = {
  lat: 38.5816,
  lng: -121.4944,
  label: "Midtown Sacramento",
};

const radiusMiles = 8;
const testUserId = "cli-test-user";

const scenarios: Scenario[] = [
  {
    name: "Food resources",
    prompt:
      "I'm currently near Midtown Sacramento at coordinates 38.5816, -121.4944. Please use the nearby resource search to list food banks within 8 miles that are open now.",
    expectedTool: "search_resources",
  },
  {
    name: "Community posts",
    prompt:
      "Using the same Midtown Sacramento coordinates (38.5816, -121.4944), show me the most recent community posts nearby.",
    expectedTool: "search_posts",
  },
  {
    name: "Events",
    prompt:
      "Check for volunteer or community food events happening this week near Midtown Sacramento (38.5816, -121.4944).",
    expectedTool: "search_events",
  },
];

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runScenario({ name, prompt, expectedTool }: Scenario) {
  console.log("\n" + "=".repeat(72));
  console.log(`🧪 Scenario: ${name}`);
  console.log(`   Prompt: ${prompt}`);
  console.log("=".repeat(72));

  const systemPrompt = buildSousChefSystemPrompt({
    location: mockLocation,
    radiusMiles,
    userId: testUserId,
  });

  const result = await streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5"),
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
    tools: sousChefTools,
  });

  const toolsUsed = new Set<string>();

  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      process.stdout.write(chunk.text);
    } else if (chunk.type === "tool-call") {
      toolsUsed.add(chunk.toolName);
      console.log(`\n\n🔧 Tool Called: ${chunk.toolName}`);
      console.log(`   Input: ${JSON.stringify(chunk.input, null, 2)}`);
    } else if (chunk.type === "tool-result") {
      console.log(`\n✅ Tool Result (${chunk.toolName}):`);
      console.log(`   ${JSON.stringify(chunk.output, null, 2).slice(0, 400)}\n`);
    }
  }

  if (!toolsUsed.has(expectedTool)) {
    throw new Error(
      `Expected tool "${expectedTool}" was not used. Tools observed: ${Array.from(
        toolsUsed
      ).join(", ") || "none"}`
    );
  }

  console.log("\n" + "-".repeat(72));
  console.log(`✅ Scenario "${name}" completed. Tools used: ${Array.from(toolsUsed).join(", ")}`);
  console.log("-".repeat(72));
}

async function main() {
  console.log("\n🚀 Sous-Chef Tool Smoke Test");
  console.log(`📍 Mock Location: ${mockLocation.label} (${mockLocation.lat}, ${mockLocation.lng})`);
  console.log(`📏 Radius: ${radiusMiles} miles`);
  console.log(`👤 Test User: ${testUserId}`);
  console.log(`🤖 Model: ${process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5"}`);

  for (const scenario of scenarios) {
    await runScenario(scenario);
    await pause(1500);
  }

  console.log("\n✨ All scenarios passed.\n");
  console.log("Next steps:");
  console.log("  1. Wire browser requests to include location/userId when available.");
  console.log("  2. Expand scenarios as new tools/routes land.");
  console.log("  3. Integrate into CI (optional) with a mock provider.");
}

main().catch((error) => {
  console.error("\n❌ Test run failed.\n", error);
  process.exitCode = 1;
});
