// Try to load .env without requiring the dotenv package
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv/config");
} catch {
  // Minimal fallback loader
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      const [key, ...rest] = line.split("=");
      if (!key) continue;
      const value = rest.join("=").trim().replace(/^"+|"+$/g, "");
      if (value) process.env[key] = value;
    }
  }
}
import { searchResourcesInArea } from "../src/lib/discovery/tavily-search";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { isTrustedSource } from "../src/lib/resource-normalizer";
import type { HoursType } from "../src/lib/schema";

// ANSI Color Codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

function formatHours(hours: HoursType | null | undefined): string {
  if (!hours) return "Not available";
  const summarize = (day: keyof HoursType) => {
    const entry = hours[day];
    if (!entry) return `${capitalize(day)}: —`;
    if (entry.closed) return `${capitalize(day)}: Closed`;
    return `${capitalize(day)}: ${entry.open} - ${entry.close}`;
  };
  return [
    summarize("monday"),
    summarize("tuesday"),
    summarize("wednesday"),
    summarize("thursday"),
    summarize("friday"),
    summarize("saturday"),
    summarize("sunday"),
  ].join("\n      ");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log(`${BOLD}${BLUE}=== Just-in-Time Discovery Visualizer ===${RESET}`);
  console.log("This tool runs the live Tavily -> LLM pipeline to verify data quality.\n");

  while (true) {
    try {
      const city = await rl.question(`${BOLD}Enter City (or 'exit'): ${RESET}`);
      if (city.toLowerCase() === "exit") break;
      if (!city.trim()) continue;

      const state = await rl.question(`${BOLD}Enter State (e.g. CA): ${RESET}`);
      if (state.toLowerCase() === "exit") break;
      if (!state.trim()) continue;

      console.log(`\n${YELLOW}Searching for food resources in ${city}, ${state}...${RESET}`);
      const startTime = Date.now();

      const results = await searchResourcesInArea(city, state, (update) => {
        if (update.stage === "processing") {
          process.stdout.write(`\r${BLUE}[${update.stage}] ${update.message}${RESET}   `);
        } else {
          console.log(`${BLUE}[${update.stage}] ${update.message}${RESET}`);
        }
      });
      console.log(""); // Newline after progress

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n${GREEN}Found ${results.length} results in ${duration}s:${RESET}\n`);

      if (results.length === 0) {
        console.log(`${RED}No results found. Check your API keys or search terms.${RESET}\n`);
        continue;
      }

      results.forEach((res, index) => {
        const trusted = isTrustedSource(res.sourceUrl);
        console.log(`${BOLD}${CYAN}[${index + 1}] ${res.name}${RESET}`);
        console.log(`    ${BOLD}Address:${RESET}  ${res.address}, ${res.zipCode}`);
        console.log(`    ${BOLD}Services:${RESET} ${res.services.join(", ") || "—"}`);
        
        if (res.phone) console.log(`    ${BOLD}Phone:${RESET}    ${res.phone}`);
        if (res.website) console.log(`    ${BOLD}Website:${RESET}  ${res.website}`);
        
        console.log(`    ${BOLD}Hours:${RESET}`);
        console.log(`      ${formatHours(res.hours ?? null)}`.replace(/\n/g, "\n      "));

        console.log(`    ${BOLD}Source:${RESET}   ${res.sourceUrl ?? "—"} ${trusted ? `${MAGENTA}[trusted]${RESET}` : ""}`);
        console.log(`    ${BOLD}Confidence:${RESET} ${(res.confidence ?? 0).toFixed(2)}`);
        console.log(""); // Empty line separator
      });

    } catch (error) {
      console.error(`${RED}Error:${RESET}`, error);
    }

    console.log(`${BLUE}----------------------------------------${RESET}\n`);
  }

  rl.close();
  process.exit(0);
}

main();
