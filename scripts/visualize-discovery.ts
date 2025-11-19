import { searchResourcesInArea } from "../src/lib/discovery/tavily-search";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ANSI Color Codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

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
        console.log(`${BOLD}${CYAN}[${index + 1}] ${res.name}${RESET}`);
        console.log(`    ${BOLD}Address:${RESET}  ${res.address}, ${res.zipCode}`);
        console.log(`    ${BOLD}Services:${RESET} ${res.services.join(", ")}`);
        
        if (res.phone) console.log(`    ${BOLD}Phone:${RESET}    ${res.phone}`);
        if (res.website) console.log(`    ${BOLD}Website:${RESET}  ${res.website}`);
        
        if (res.hours) {
          console.log(`    ${BOLD}Hours:${RESET}`);
          Object.entries(res.hours).forEach(([day, time]) => {
            if (time) {
              console.log(`      - ${day}: ${time.open} - ${time.close}`);
            }
          });
        } else {
          console.log(`    ${BOLD}Hours:${RESET}    ${YELLOW}Not available${RESET}`);
        }

        console.log(`    ${BOLD}Source:${RESET}   ${res.sourceUrl}`);
        console.log(`    ${BOLD}Confidence:${RESET} ${res.confidence}`);
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
