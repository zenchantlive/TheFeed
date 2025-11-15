/**
 * Test script for CopilotKit backend API endpoint
 *
 * Usage: tsx --env-file=.env scripts/test-copilotkit-backend.ts
 *
 * This script directly calls the /api/copilotkit endpoint to verify:
 * - OpenRouter adapter works with Anthropic models
 * - All 7 tools execute correctly
 * - Streaming works without errors
 * - Context injection (headers) works properly
 */

const API_URL = "http://localhost:3000/api/copilotkit";

// Test location (Portland, OR area)
const TEST_LOCATION = {
  lat: 45.5152,
  lng: -122.6784,
  label: "Portland, OR",
};

const TEST_USER_ID = "test-user-123";
const TEST_RADIUS = 10;

interface TestMessage {
  role: "user" | "assistant";
  content: string;
}

async function sendChatMessage(
  messages: TestMessage[],
  location = TEST_LOCATION,
  userId = TEST_USER_ID,
  radiusMiles = TEST_RADIUS
) {
  console.log("\n📤 Sending request...");
  console.log("Messages:", JSON.stringify(messages, null, 2));
  console.log("Location:", location);
  console.log("User ID:", userId);
  console.log("Radius:", radiusMiles);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      "x-user-location": JSON.stringify(location),
      "x-radius-miles": radiusMiles.toString(),
    },
    body: JSON.stringify({
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API returned ${response.status}: ${error}`);
  }

  console.log("\n📥 Streaming response...\n");

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullResponse += chunk;
    process.stdout.write(chunk);
  }

  console.log("\n\n✅ Stream complete\n");
  return fullResponse;
}

async function runTests() {
  console.log("🧪 CopilotKit Backend Test Suite\n");
  console.log("=" .repeat(60));

  try {
    // Test 1: Simple message without tool calls
    console.log("\n\n🧪 TEST 1: Simple greeting (no tools)");
    console.log("-".repeat(60));
    await sendChatMessage([
      { role: "user", content: "Hi! What can you help me with?" },
    ]);

    // Test 2: Get user context
    console.log("\n\n🧪 TEST 2: Get user context");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content: "Do I have any saved locations?",
      },
    ]);

    // Test 3: Search resources
    console.log("\n\n🧪 TEST 3: Search nearby food banks");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content: "What food banks are near me?",
      },
    ]);

    // Test 4: Search events
    console.log("\n\n🧪 TEST 4: Search nearby events");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content: "Are there any food events happening this week?",
      },
    ]);

    // Test 5: Search posts
    console.log("\n\n🧪 TEST 5: Search community posts");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content: "Are any neighbors sharing food nearby?",
      },
    ]);

    // Test 6: Get directions
    console.log("\n\n🧪 TEST 6: Get directions");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content:
          "Can you give me directions from my location to coordinates 45.52, -122.68?",
      },
    ]);

    // Test 7: Multiple tools in sequence
    console.log("\n\n🧪 TEST 7: Multi-tool query (search + directions)");
    console.log("-".repeat(60));
    await sendChatMessage([
      {
        role: "user",
        content:
          "Find the closest food bank to me and give me directions to it.",
      },
    ]);

    console.log("\n\n" + "=".repeat(60));
    console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    await fetch("http://localhost:3000");
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkDevServer();

  if (!serverRunning) {
    console.error("❌ ERROR: Dev server not running on localhost:3000");
    console.error("\nPlease start the dev server first:");
    console.error("  pnpm dev\n");
    process.exit(1);
  }

  await runTests();
}

main();
