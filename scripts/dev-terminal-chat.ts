/**
 * Minimal terminal-based Sous-Chef chat for local debugging.
 *
 * Usage examples:
 *   pnpm exec tsx --env-file=.env scripts/dev-terminal-chat.ts
 *   pnpm exec tsx --env-file=.env scripts/dev-terminal-chat.ts --user demo-user --lat 38.58 --lng -121.49 --radius 5
 *
 * Commands inside the REPL:
 *   /exit   -> quit the chat
 */

import "dotenv/config";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { sousChefTools } from "../src/lib/ai-tools";
import {
  buildSousChefSystemPrompt,
  type LocationContext,
} from "../src/lib/prompts/chat-system";

type CliOptions = {
  userId: string | null;
  radiusMiles: number;
  location?: LocationContext | null;
};

const DEFAULT_RADIUS = 10;

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    userId: null,
    radiusMiles: DEFAULT_RADIUS,
  };

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const next = args[index + 1];

    if (!next) continue;

    switch (key) {
      case "--user":
      case "--userId":
        options.userId = next;
        index += 1;
        break;
      case "--radius":
      case "--radiusMiles":
        options.radiusMiles = Number(next) || DEFAULT_RADIUS;
        index += 1;
        break;
      case "--lat":
        options.location = {
          ...(options.location ?? { lng: 0 }),
          lat: Number(next),
        };
        index += 1;
        break;
      case "--lng":
        options.location = {
          ...(options.location ?? { lat: 0 }),
          lng: Number(next),
        };
        index += 1;
        break;
      case "--label":
        options.location = {
          ...(options.location ?? {}),
          label: next,
        } as LocationContext;
        index += 1;
        break;
      default:
        break;
    }
  }

  return options;
}

async function main() {
  const opts = parseArgs();
  const rl = createInterface({ input, output });
  const messages: UIMessage[] = [];

  const intro = [
    "👩‍🍳 Sous-Chef terminal chat",
    opts.userId ? `User: ${opts.userId}` : "User: anonymous",
    opts.location
      ? `Location: ${opts.location.lat}, ${opts.location.lng} (${opts.location.label ?? "no label"})`
      : "Location: not provided",
    `Radius: ${opts.radiusMiles} miles`,
    "",
    "Type your question and press Enter. Use /exit to quit.",
    "",
  ].join("\n");

  console.log(intro);

  for (;;) {
    const userInput = await rl.question("> ");
    const trimmed = userInput.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed === "/exit") {
      break;
    }

    const userMessage: UIMessage = {
      id: randomUUID(),
      role: "user",
      parts: [{ type: "text", text: trimmed }],
    };

    messages.push(userMessage);

    const systemPrompt = buildSousChefSystemPrompt({
      location: opts.location,
      radiusMiles: opts.radiusMiles,
      userId: opts.userId,
    });

    const result = streamText({
      model: openrouter(process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5"),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools: sousChefTools,
      toolChoice: "auto",
    });

    let assistantText = "";
    const toolCalls: string[] = [];

    process.stdout.write("\nSous-Chef: ");

    for await (const chunk of result.fullStream) {
      if (chunk.type === "text-delta") {
        assistantText += chunk.text;
        process.stdout.write(chunk.text);
      } else if (chunk.type === "tool-call") {
        toolCalls.push(chunk.toolName);
        process.stdout.write(
          `\n[tool:${chunk.toolName}] ${JSON.stringify(chunk.input)}\n`
        );
      } else if (chunk.type === "tool-result") {
        process.stdout.write(
          `\n[result:${chunk.toolName}] ${JSON.stringify(chunk.output).slice(
            0,
            400
          )}\n`
        );
      }
    }

    process.stdout.write("\n\n");

    messages.push({
      id: randomUUID(),
      role: "assistant",
      parts: [{ type: "text", text: assistantText || "(no response)" }],
    });

    if (toolCalls.length > 0) {
      console.log(`Tools used: ${toolCalls.join(", ")}`);
    }

    console.log("");
  }

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("Terminal chat failed:", error);
  process.exit(1);
});
