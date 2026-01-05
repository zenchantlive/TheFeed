---
title: "Part 4: The AI Sous-Chef - Chat Tools and OpenRouter"
series: "TheFeed Development Journey"
part: 4
date: 2025-11-07
updated: 2025-12-27
tags: [ai, llm, tool-calling, openrouter, vercel-ai-sdk]
reading_time: "14 min"
commits_covered: "ba84abb..d06b57a"
---

## The Chat Vision

With the map working, I had food bank discovery. But the **real** vision was deeper: an AI assistant that could understand "I'm hungry" and respond with personalized, actionable help.

Not a generic chatbot. A **sous-chef** who:
- Knows your saved locations
- Understands your current position
- Can search nearby resources
- Provides turn-by-turn directions
- Offers meal planning suggestions

Building this required moving beyond simple chat to **tool calling** - giving the LLM the ability to invoke functions and return structured data.

## The OpenRouter Migration

The starter kit used OpenAI directly via `@ai-sdk/openai`. But for FoodShare, I wanted:

- **Model flexibility**: Try different models (Claude, GPT, Llama)
- **Cost control**: OpenRouter's unified billing and fallbacks
- **Anthropic access**: Claude Sonnet 4.5 was showing better results for nuanced conversations

So commit `61e98f2` migrated to OpenRouter:

```typescript
// src/app/api/chat/route.ts - After migration
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter(process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

Simple change, massive flexibility. Now I could switch models with an environment variable.

## Implementing Tool Calling

The Vercel AI SDK makes tool calling elegant:

```typescript
// src/app/api/chat/route.ts - Adding tools
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter('anthropic/claude-sonnet-4.5'),
    messages,
    tools: {
      search_resources: {
        description: 'Search for food banks and pantries near a location',
        parameters: z.object({
          city: z.string().describe('City name'),
          state: z.string().length(2).describe('Two-letter state code'),
          radius: z.number().optional().describe('Search radius in miles (default 10)'),
        }),
        execute: async ({ city, state, radius = 10 }) => {
          // Geocode city
          const coords = await geocodeCity(city, state);
          if (!coords) {
            return { error: 'Could not find coordinates for that city' };
          }

          // Search food banks
          const results = await searchFoodBanks({
            latitude: coords.lat,
            longitude: coords.lng,
            radiusMiles: radius,
          });

          return { resources: results, count: results.length };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

This is **declarative** tool calling:
- Define the tool's schema with Zod
- Describe parameters for the LLM
- Implement the `execute` function
- Return structured data

The AI SDK handles:
- Prompting the model to decide when to use tools
- Parsing the model's tool call
- Executing the function
- Injecting results back into the conversation
- Streaming the final response

## The Tool Ecosystem

Over the next few days, I built a complete toolkit:

### 1. `search_resources` - Find Food Banks

Already shown above. The workhorse tool for discovery.

### 2. `get_resource_by_id` - Detailed Information

```typescript
get_resource_by_id: {
  description: 'Get detailed information about a specific food bank',
  parameters: z.object({
    resourceId: z.string().describe('The unique ID of the food bank'),
  }),
  execute: async ({ resourceId }) => {
    const resource = await db
      .select()
      .from(foodBanks)
      .where(eq(foodBanks.id, resourceId))
      .limit(1);

    if (!resource[0]) {
      return { error: 'Resource not found' };
    }

    return {
      resource: resource[0],
      isOpen: isCurrentlyOpen(resource[0].hours),
    };
  },
},
```

Used when users ask "Tell me more about..." or "What are the hours at..."

### 3. `get_directions` - Turn-by-Turn Guidance

```typescript
get_directions: {
  description: 'Get directions from user location to a food bank',
  parameters: z.object({
    destinationId: z.string().describe('Food bank ID'),
    origin: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional().describe('Starting location (defaults to user location)'),
  }),
  execute: async ({ destinationId, origin }) => {
    const destination = await db
      .select()
      .from(foodBanks)
      .where(eq(foodBanks.id, destinationId))
      .limit(1);

    if (!destination[0]) {
      return { error: 'Destination not found' };
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${destination[0].address}, ${destination[0].city}, ${destination[0].state}`
    )}`;

    return {
      destination: destination[0],
      directionsUrl: googleMapsUrl,
      distance: origin
        ? calculateDistance(
            origin.lat,
            origin.lng,
            destination[0].latitude,
            destination[0].longitude
          )
        : null,
    };
  },
},
```

Returns a Google Maps directions link. Later iterations would use Mapbox Directions API for in-app navigation.

### 4. `get_user_context` - Personalization

```typescript
get_user_context: {
  description: 'Get user profile and saved locations for personalized help',
  parameters: z.object({}),
  execute: async () => {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return { authenticated: false };
    }

    const savedLocations = await db
      .select()
      .from(savedLocations)
      .where(eq(savedLocations.userId, session.user.id))
      .leftJoin(foodBanks, eq(savedLocations.foodBankId, foodBanks.id));

    return {
      authenticated: true,
      user: session.user,
      savedLocations: savedLocations.map((sl) => sl.food_banks),
    };
  },
},
```

This enabled the assistant to say "Your saved location, Sacramento Food Bank, is open right now."

## The Terminal Debugger

Tool calling is tricky to debug in a UI. I built a terminal harness for testing:

```typescript
// scripts/dev-terminal-chat.ts
import readline from 'readline';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { sousChefTools } from '@/lib/ai-tools';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: any[] = [];

async function chat(userMessage: string) {
  messages.push({ role: 'user', content: userMessage });

  const result = streamText({
    model: openrouter('anthropic/claude-sonnet-4.5'),
    messages,
    tools: sousChefTools,
  });

  let fullResponse = '';

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    fullResponse += chunk;
  }

  messages.push({ role: 'assistant', content: fullResponse });
  console.log('\n');
}

function prompt() {
  rl.question('You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    await chat(input);
    prompt();
  });
}

console.log('FoodShare Sous-Chef (Terminal)');
console.log('Type "exit" to quit\n');
prompt();
```

Running `bun scripts/dev-terminal-chat.ts` let me test tool calls without browser debugging:

```
You: I'm hungry, what's open near Sacramento?
[Tool Call: search_resources { city: "Sacramento", state: "CA" }]
[Tool Result: { resources: [...], count: 12 }]

I found 12 food banks near Sacramento. Here are the ones open right now:

1. **Sacramento Food Bank & Family Services** (3333 3rd Ave)
   - Open until 4:00 PM today
   - Services: Emergency Food, CalFresh Assistance
   - 2.3 miles away

2. **Loaves & Fishes** (1321 N C St)
   - Open until 2:00 PM today
   - Services: Hot Meals, Groceries
   - 1.8 miles away

Would you like directions to either location?
```

This tool became essential for debugging tool call failures, streaming issues, and response quality.

## The Blank Bubble Bug

Early on, I noticed a frustrating bug: **assistant responses would sometimes appear as blank bubbles**.

After hours of debugging:

```typescript
// Client-side rendering
{messages.map((message) => (
  <div key={message.id}>
    {message.role === 'assistant' && (
      <div className="assistant-bubble">
        {message.content || <Spinner />}  {/* Bug: content was '' */}
      </div>
    )}
  </div>
))}
```

The issue? **Tool calls completing but not injecting final response**. The AI SDK was pushing a message with `role: 'assistant'` but empty `content` before the model finished generating the final text.

The fix required waiting for `onFinish`:

```typescript
const result = streamText({
  model: openrouter('anthropic/claude-sonnet-4.5'),
  messages,
  tools: sousChefTools,
  onFinish: ({ response }) => {
    // Only show message after response is complete
    setMessages((prev) => [...prev, response]);
  },
});
```

But this broke streaming UX (no progressive text rendering). The proper fix would come later with **CopilotKit** (Part 7), which handles tool call lifecycle correctly.

## System Prompting

The assistant's personality came from the system prompt:

```typescript
const systemPrompt = `You are a helpful food assistance sous-chef for TheFeed, a hyperlocal food-sharing network.

Your role:
- Help users find nearby food banks, pantries, and community resources
- Provide empathetic, non-judgmental assistance
- Give clear directions and actionable next steps
- Suggest meal planning ideas when appropriate
- Connect users with their saved locations
- Maintain a warm, supportive tone

Context:
- Users may be experiencing food insecurity
- Dignity and respect are paramount
- Keep responses concise and mobile-friendly
- Always mention if a location is currently open
- Prioritize walking-distance resources when possible

When searching:
- Default to user's current city if not specified
- Include distance in miles
- Highlight food banks that are open NOW
- Mention services offered (CalFresh, senior support, etc.)`;

const result = streamText({
  model: openrouter('anthropic/claude-sonnet-4.5'),
  messages,
  system: systemPrompt,
  tools: sousChefTools,
});
```

This prompt engineering was **critical**. Early versions were too verbose, too clinical, or missed the food security context. Iteration refined it to be warm, concise, and action-oriented.

## Voice as Interface

Food bank users often have limited literacy or prefer verbal interaction. So I prototyped voice input:

```tsx
// src/app/chat-v2/components/voice-input.tsx (later version)
export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "ghost"}
      onClick={startListening}
    >
      <Mic className={isListening ? "animate-pulse" : ""} />
    </Button>
  );
}
```

This used the browser's `webkitSpeechRecognition` API - imperfect but free and surprisingly accurate. Saying "I'm hungry" into the mic would trigger food bank searches just like typing.

## The Smart Prompts Feature

For users who don't know what to ask, I added quick action buttons:

```tsx
// src/app/chat-v2/components/actions/smart-prompts.tsx
const smartPrompts = [
  {
    label: "I'm hungry",
    icon: <UtensilsCrossed />,
    prompt: "I'm hungry right now. What food resources are open near me?",
  },
  {
    label: "Browse all",
    icon: <MapPin />,
    prompt: "Show me all food banks in my area",
  },
  {
    label: "Save location",
    icon: <Heart />,
    prompt: "I want to save my favorite food bank",
  },
];

export function SmartPrompts({ onPromptClick }: SmartPromptsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {smartPrompts.map((prompt) => (
        <Button
          key={prompt.label}
          variant="outline"
          size="sm"
          onClick={() => onPromptClick(prompt.prompt)}
        >
          {prompt.icon}
          {prompt.label}
        </Button>
      ))}
    </div>
  );
}
```

Users could tap "I'm hungry" instead of typing. This **lowered the barrier** for first-time users and those unfamiliar with chatbots.

## Performance and Streaming

Streaming responses was essential for perceived performance:

```typescript
const result = streamText({
  model: openrouter('anthropic/claude-sonnet-4.5'),
  messages,
  tools: sousChefTools,
});

// Client-side rendering
for await (const chunk of result.textStream) {
  setStreamingText((prev) => prev + chunk);
}
```

This showed partial responses as the model generated them, creating a **conversational feel** rather than waiting 3-5 seconds for a complete answer.

But streaming introduced complexity:
- What to show during tool calls?
- How to handle errors mid-stream?
- When to mark the message as "complete"?

These questions led to the **CopilotKit migration** (Part 7), which solved streaming tool calls elegantly.

## What Went Right

Several decisions proved wise:

1. **OpenRouter Choice**: Model flexibility saved me when GPT-4 started rate limiting

2. **Separate Tool Definitions**: Extracting to `src/lib/ai-tools.ts` let me reuse tools across endpoints

3. **Terminal Debugger**: `dev-terminal-chat.ts` made debugging 10x faster

4. **System Prompt Engineering**: Investing time to refine the assistant's personality paid off

5. **Voice + Smart Prompts**: Lowering barriers to entry mattered for target users

## What I'd Do Differently

Some early mistakes:

### Mistake 1: Tight Coupling to Chat UI

Tools were defined inside the API route. When I later wanted to use them elsewhere (CopilotKit, terminal), I had to refactor. Should have extracted from day one.

### Mistake 2: No Tool Call Logging

Early debugging was painful because I couldn't see:
- Which tools were called
- What parameters were passed
- How long execution took
- What results were returned

Adding a `logChatTool` tool (meta!) helped, but structured logging should have been built in.

### Mistake 3: Geocoding Every Request

Every `search_resources` call geocoded the city name. With caching, this could have been 100x faster:

```typescript
// Better approach (added later)
const cityCache = new Map<string, Coords>();

async function geocodeCity(city: string, state: string) {
  const cacheKey = `${city},${state}`;
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey);
  }

  const coords = await fetchGeocoding(city, state);
  cityCache.set(cacheKey, coords);
  return coords;
}
```

## What I Learned

Building the AI sous-chef taught crucial lessons:

1. **Tool Calling Changes Everything**: LLMs with function access are qualitatively different from pure chat

2. **Prompts Are Code**: System prompts need version control, testing, and iteration like any other code

3. **Streaming Requires Care**: Progressive rendering improves UX but adds complexity around error handling and state management

4. **Terminal Debugging Saves Time**: Don't debug complex AI flows in a browser when you can use a REPL

5. **Voice Matters**: For accessibility, verbal interfaces aren't optional

## The User Experience

With the AI sous-chef working, users could:
- Ask "I'm hungry" and get instant, personalized results
- Request directions and receive Google Maps links
- Save favorite locations for quick recall
- Get hours, services, and contact info conversationally
- Use voice input instead of typing

This was **functional magic** - the combination of chat UX, tool calling, and real-time data created something that felt genuinely helpful.

## Up Next

In Part 5, I'll cover building community features - the social infrastructure that let neighbors share food directly through posts, comments, karma systems, and follows.

---
**Key Commits**:
- `61e98f2` - Migrate from OpenAI to OpenRouter integration
- `ba84abb` - Extend GET locations API to support fetching all saved locations
- `d06b57a` - Implement Phase 1 community social infrastructure

**Related Files**:
- `src/app/api/chat/route.ts` - Chat endpoint with tool calling
- `src/lib/ai-tools.ts` - Shared tool definitions
- `scripts/dev-terminal-chat.ts` - Terminal debugging harness
- `src/app/chat-v2/components/voice-input.tsx` - Voice interface
