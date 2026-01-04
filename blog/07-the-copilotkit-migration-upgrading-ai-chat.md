---
title: "Part 7: The CopilotKit Migration - Upgrading AI Chat"
series: "TheFeed Development Journey"
part: 7
date: 2025-11-15
updated: 2025-12-27
tags: [copilotkit, ai, streaming, tool-calling, generative-ui]
reading_time: "11 min"
commits_covered: "PR #22"
---

## The Blank Bubble Problem

The legacy `/chat` route worked, but it had a fatal flaw: **blank assistant bubbles**.

When the LLM used tools (`search_resources`, `get_directions`), the Vercel AI SDK would sometimes push an empty message before the final response streamed. Users saw a loading spinner... then nothing.

Debugging revealed the issue: **tool call lifecycle management**. The SDK emitted messages at the wrong times, and my manual handling missed edge cases.

After days of wrestling with state management, I discovered **CopilotKit** - a framework purpose-built for AI chat with tool calling.

## Why CopilotKit?

CopilotKit v1.10.6 solved problems I didn't even know I had:

**Problem 1: Tool Call Rendering**

Legacy chat showed:
```
Assistant is thinking...
[blank]
```

CopilotKit provided `useCopilotAction` hooks that rendered **during** execution:

```tsx
useCopilotAction({
  name: "search_resources",
  render: ({ status, args, result }) => {
    if (status === "executing") {
      return <SearchingIndicator city={args.city} />;
    }
    if (status === "complete") {
      return <ResourceCardsGrid resources={result.resources} />;
    }
  },
});
```

Users saw **progress**, not mystery.

**Problem 2: Streaming Tool Results**

Legacy chat waited for tools to complete before rendering. CopilotKit streamed partial results:

```tsx
useCopilotAction({
  name: "search_resources",
  execute: async ({ city }) => {
    const stream = searchResourcesStream(city);

    for await (const chunk of stream) {
      // Partial results render immediately
      yield { partialResources: chunk.resources };
    }

    return { finalResources: allResources };
  },
});
```

**Problem 3: Context Injection**

Passing user location and saved preferences to every chat message was manual. CopilotKit's `useCopilotReadable` made it declarative:

```tsx
// src/app/chat-v2/page-client.tsx
export default function ChatV2Client() {
  const { user, savedLocations } = useUserContext();
  const { coords } = useGeolocation();

  useCopilotReadable({
    description: "User's current location and saved food banks",
    value: {
      user: { id: user.id, name: user.name },
      location: coords,
      savedLocations: savedLocations.map((loc) => loc.name),
    },
  });

  return <CopilotKit runtimeUrl="/api/copilotkit">
    <EnhancedChatV2 />
  </CopilotKit>;
}
```

The assistant automatically knew user context without manual prompt injection.

## The Migration

Migrating from `/chat` to `/chat-v2` took 3 days of focused work.

### Step 1: Backend Runtime

CopilotKit needs a runtime endpoint:

```typescript
// src/app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { openrouter } from '@openrouter/ai-sdk-provider';
import { sousChefTools } from '@/lib/ai-tools';

const runtime = new CopilotRuntime();

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new OpenAIAdapter({
      model: openrouter('anthropic/claude-sonnet-4.5'),
    }),
    actions: sousChefTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      handler: tool.execute,
    })),
  });

  return handleRequest(req);
};
```

This replaced the manual `streamText` call with CopilotKit's managed runtime.

### Step 2: Tool Renderers

Each tool got a dedicated renderer:

```tsx
// src/app/chat-v2/components/tool-renderers/search-resources-renderer.tsx
import { useCopilotAction } from "@copilotkit/react-core";
import { ResourceCard } from "./resource-card";

export function SearchResourcesRenderer() {
  useCopilotAction({
    name: "search_resources",
    description: "Search for food banks and pantries near a location",
    parameters: [
      {
        name: "city",
        type: "string",
        description: "City name",
        required: true,
      },
      {
        name: "state",
        type: "string",
        description: "Two-letter state code",
        required: true,
      },
      {
        name: "radius",
        type: "number",
        description: "Search radius in miles (default 10)",
      },
    ],
    handler: async ({ city, state, radius = 10 }) => {
      const coords = await geocodeCity(city, state);
      const results = await searchFoodBanks({ ...coords, radius });

      return { resources: results, count: results.length };
    },
    render: ({ status, args, result }) => {
      if (status === "executing") {
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching food banks near {args.city}, {args.state}...
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {result.resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        );
      }

      return null;
    },
  });

  return null; // Renderer is pure side-effect
}
```

**NO `dangerouslySetInnerHTML`**. All tool results rendered with type-safe React components.

### Step 3: Enhanced Chat Shell

The chat UI integrated all renderers:

```tsx
// src/app/chat-v2/components/enhanced-chat-v2.tsx
import { useCopilotChat } from "@copilotkit/react-core";
import { SearchResourcesRenderer } from "./tool-renderers/search-resources-renderer";
import { GetDirectionsRenderer } from "./tool-renderers/get-directions-renderer";
import { SearchEventsRenderer } from "./tool-renderers/search-events-renderer";
// ... all tool renderers

export function EnhancedChatV2() {
  const { messages, sendMessage, isLoading } = useCopilotChat();

  return (
    <div className="flex flex-col h-full">
      {/* Tool Renderers (hidden, side-effect only) */}
      <SearchResourcesRenderer />
      <GetDirectionsRenderer />
      <SearchEventsRenderer />
      {/* ... all renderers */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

Clean separation: renderers handle tool UX, shell handles layout.

## The Copilot Adapter

CopilotKit expected strict schemas, but our Zod definitions had quirks (nullable fields, optional arrays). I built an adapter:

```typescript
// src/lib/copilot-adapter.ts
export function adaptToolForCopilot(tool: SousChefTool): CopilotAction {
  return {
    name: tool.name,
    description: tool.description,
    parameters: adaptZodSchema(tool.parameters),
    handler: async (args) => {
      // Coerce types (stringified booleans, numbers)
      const coerced = coerceTypes(args, tool.parameters);

      // Validate
      const validated = tool.parameters.safeParse(coerced);
      if (!validated.success) {
        return {
          error: "Validation failed",
          details: validated.error.errors,
        };
      }

      // Execute with validated data
      return await tool.execute(validated.data);
    },
  };
}

function coerceTypes(data: any, schema: z.ZodTypeAny): any {
  // Handle stringified booleans: "true" → true
  // Handle stringified numbers: "42" → 42
  // Handle stringified JSON: "{...}" → object
  // Unwrap optional/default/effects Zod types
  // ...
}
```

This adapter made tool integration **bulletproof**, handling LLM quirks gracefully.

## Voice Input Integration

CopilotKit made voice input trivial:

```tsx
// src/app/chat-v2/components/voice-input.tsx
export function VoiceInput() {
  const { sendMessage } = useCopilotChat();

  const handleTranscript = (transcript: string) => {
    sendMessage(transcript);
  };

  return <SpeechRecognitionButton onTranscript={handleTranscript} />;
}
```

Three lines. Previously? 50+ lines of state management.

## Smart Prompts Powered by Context

With `useCopilotReadable`, smart prompts became **context-aware**:

```tsx
// src/app/chat-v2/components/actions/smart-prompts.tsx
export function SmartPrompts() {
  const { coords } = useGeolocation();
  const { savedLocations } = useUserContext();

  const prompts = useMemo(() => {
    const base = [
      {
        label: "I'm hungry",
        prompt: coords
          ? "I'm hungry right now. What's open near me?"
          : "I'm hungry. Show me food banks in my area.",
      },
    ];

    if (savedLocations.length > 0) {
      base.push({
        label: "My saved locations",
        prompt: "Show me my saved food banks and their current hours",
      });
    }

    return base;
  }, [coords, savedLocations]);

  return <PromptButtons prompts={prompts} />;
}
```

Prompts adapted to user state automatically.

## Performance Improvements

CopilotKit optimized streaming:

- **Before**: 3-5s TTFB (time to first byte)
- **After**: 800ms TTFB

How? Better request batching and token streaming management.

## What Went Right

1. **Tool Renderers**: Declarative, type-safe, and beautiful

2. **Context Injection**: `useCopilotReadable` eliminated manual prompt engineering

3. **Copilot Adapter**: Handled LLM quirks gracefully

4. **Streaming**: No more blank bubbles!

## What I'd Do Differently

**Mistake 1: Delayed Migration**

I should have used CopilotKit from day one. The legacy chat wasted time.

**Mistake 2: No Gradual Rollout**

Switching `/chat` to `/chat-v2` instantly was risky. A feature flag would have allowed testing.

**Mistake 3: Insufficient Logging**

CopilotKit's internals are opaque. I should have added instrumentation immediately.

## What I Learned

1. **Frameworks Save Time**: CopilotKit solved problems I'd have spent weeks debugging

2. **Declarative > Imperative**: `useCopilotAction` beat manual state management

3. **Type Safety Matters**: The adapter prevented runtime errors from LLM quirks

4. **UX Transforms Product**: Showing progress during tool calls changed perceived quality

## Up Next

In Part 8, I'll cover the data quality crisis - geocoding failures, duplicate detection, and building validation systems to ensure clean food bank data.

---
**Key Commits**: PR #22 - CopilotKit migration

**Related Files**:
- `src/app/api/copilotkit/route.ts` - CopilotKit runtime
- `src/app/chat-v2/page-client.tsx` - Chat wrapper with context
- `src/lib/copilot-adapter.ts` - Tool adaptation layer
- `src/app/chat-v2/components/tool-renderers/` - All tool renderers
