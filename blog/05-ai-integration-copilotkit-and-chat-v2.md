---
title: "Part 5: AI Integration - Building the Sous-Chef with CopilotKit"
series: "TheFeed Development Journey"
part: 5
date: 2025-11-15
updated: 2025-12-27
tags: ["ai", "copilotkit", "chat-v2", "streaming"]
reading_time: "11 min"
commits_covered: "bda0fce..a22fbe5"
---

## Where We Are

By mid-November, the platform had solid community features, but the AI experience needed a complete overhaul. The original `/chat` page had stability issues—blank assistant bubbles, dropped streams, and limited tool integration. On November 15, 2025, the team shipped **CopilotKit v2 Integration** (`bda0fce` through `a22fbe5`), transforming the AI from a chatbot into a true sous-chef assistant.

## The Problem with the Original Chat

The legacy `src/app/chat/page.tsx` used Vercel AI SDK's `useChat` hook with these issues:

1. **Stream Dropout**: When the provider dropped the stream, the UI showed a blank assistant message
2. **Limited Tool Rendering**: Tool responses appeared as JSON blobs, not rich UI
3. **No Context**: The AI didn't know the user's location, saved locations, or current mode
4. **Tool Execution**: Tool responses weren't automatically parsed and rendered

The team decided: **rewrite, don't patch**.

## Why CopilotKit?

CopilotKit is a framework specifically designed for agent-driven UIs. Key benefits:

1. **Tool Lifecycle Management**: Define tools once, they work everywhere
2. **Rich Renderers**: Each tool has a custom React component for rendering
3. **State Sync**: `useCopilotReadable` makes any state available to the AI
4. **Action Callbacks**: `useCopilotAction` lets components react to tool executions
5. **Production Ready**: Built-in error handling, retry logic, streaming fixes

## The Architecture: `src/app/chat-v2`

The new chat system had multiple layers:

### 1. **Backend Runtime** (`src/app/api/copilotkit/route.ts`)
```typescript
import { CopilotRuntime } from "@copilotkit/runtime";
import { sousChefTools } from "@/lib/ai-tools";

export const POST = CopilotRuntime({
    tools: sousChefTools,
});
```

Simple! One endpoint exposes all tools to CopilotKit.

### 2. **Shared Tool Definitions** (`src/lib/ai-tools.ts`)

The team extracted all tools into a single file used by both CopilotKit and terminal testers:

```typescript
export const sousChefTools: CopilotTool[] = [
    {
        name: "search_resources",
        description: "Find food banks and assistance programs near a location",
        parameters: z.object({
            latitude: z.number(),
            longitude: z.number(),
            radiusMiles: z.number().default(5),
        }),
        execute: async ({latitude, longitude, radiusMiles}) => {
            return await searchFoodBanks(latitude, longitude, radiusMiles);
        },
    },
    {
        name: "search_posts",
        description: "Find peer posts (offers, requests, events) by mood and location",
        parameters: z.object({
            mood: z.enum(["hungry", "full", "all"]),
            latitude: z.number(),
            longitude: z.number(),
        }),
        execute: async ({mood, latitude, longitude}) => {
            return await searchPosts({mood, location: [latitude, longitude]});
        },
    },
    {
        name: "get_directions",
        description: "Generate directions from current location to a destination",
        parameters: z.object({
            destinationName: z.string(),
            destinationLat: z.number(),
            destinationLng: z.number(),
        }),
        execute: async ({destinationName, destinationLat, destinationLng}) => {
            return {
                directions: `Directions to ${destinationName}...`,
                url: `https://maps.google.com/?q=${destinationLat},${destinationLng}`,
            };
        },
    },
    // ... more tools: get_user_context, get_resource_by_id, search_events, log_chat
];
```

**Why a Single Source of Truth?**
- Consistency across all AI interfaces
- Easier to test (can be called from CLI)
- Changes in one place fix everywhere
- Type-safe Zod definitions

### 3. **Tool Renderers** (`src/app/chat-v2/components/tool-renderers/`)

Each tool has a custom React component:

```typescript
// search-resources-renderer.tsx
export function SearchResourcesRenderer({action}: {action: CopilotAction}) {
    const resources = action.result as ResourceResult[];

    return (
        <div className="grid grid-cols-1 gap-2">
            {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
            ))}
        </div>
    );
}

// search-events-renderer.tsx
export function SearchEventsRenderer({action}: {action: CopilotAction}) {
    const events = action.result as EventResult[];

    return (
        <div className="space-y-3">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
```

**Critical Design Decision**: Never use `dangerouslySetInnerHTML`. All renderers are type-safe React components.

### 4. **Client Setup** (`src/app/chat-v2/page-client.tsx`)

```typescript
import { CopilotKit } from "@copilotkit/react-core";
import { EnhancedChatV2 } from "./components/enhanced-chat-v2";

export default function ChatV2Page() {
    const { data: session } = useSession();
    const userLocation = useDetectLocation(); // Geolocation

    // Make user context available to AI
    const userContext = useMemo(() => ({
        userId: session?.user.id,
        userName: session?.user.name,
        location: userLocation,
        savedLocations: useSavedLocations(),
    }), [session, userLocation]);

    useCopilotReadable({
        description: "Current user context",
        value: userContext,
    });

    return (
        <CopilotKit runtimeUrl="/api/copilotkit">
            <EnhancedChatV2 userContext={userContext} />
        </CopilotKit>
    );
}
```

**Context Injection**:
- AI knows user's current location (with permission)
- AI knows user's saved locations
- AI can personalize responses
- AI can infer intent ("I'm hungry" vs "I want to help")

### 5. **Chat UI** (`src/app/chat-v2/components/enhanced-chat-v2.tsx`)

The new chat interface featured:
- **Smart Prompts**: Context-aware suggestions ("Resources near you", "Create event", "Post an offer")
- **Typing Indicator**: Shows when AI is thinking or calling tools
- **Message Rendering**: Handles text and tool results elegantly
- **Tool Renderers**: Auto-selects renderer based on tool name

```typescript
function ChatContent({message}: {message: Message}) {
    if (message.role === "assistant" && message.toolResult) {
        const Tool = toolRenderers[message.toolName];
        if (Tool) {
            return <Tool action={message.toolResult} />;
        }
    }

    return (
        <div className="prose prose-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
    );
}
```

## The Prompt Engineering

The system prompt was crucial. It guided the AI to be:
- **Helpful, not preachy**: "Let me find some options" not "You should definitely eat"
- **Location-aware**: Prioritize nearby resources
- **Action-oriented**: Offer next steps (map, event, post)
- **Humble**: Acknowledge limitations

```typescript
const systemPrompt = `You are TheFeed's sous-chef assistant. Your goal is to help
people experiencing food insecurity find resources and connect with neighbors.

Key principles:
1. Preserve dignity. Never condescend. Treat all users as equals.
2. Use tools to find real options, not generic advice.
3. Prioritize nearby resources within walking/biking distance.
4. Suggest community events and peer sharing when relevant.
5. Be honest about limitations.

Available tools: search_resources, search_posts, search_events, get_directions, get_user_context

Start by understanding the user's location and immediate need.`;
```

## The Desktop + Mobile Layouts

The chat-v2 required careful layout consideration:

### Desktop
- Full-height chat panel on right
- Map or content on left
- Responsive to widows resize

### Mobile
- Full-screen modal
- Overlay above main content
- Dismissible

The team solved layout issues (`d614684`, `a3d7d0d`) by establishing a **viewport height chain**:

```css
/* globals.css */
html {
    height: 100%;
}

body {
    height: 100%;
}

#__next {
    display: flex;
    flex-direction: column;
    height: 100%;
}
```

This simple structure prevented the common "full-page chat is cut off" issue.

## The Testing Infrastructure

The team built `scripts/dev-terminal-chat.ts` and `scripts/test-chat-tools.ts` to test tools outside of the UI:

```typescript
// Test tool execution without CopilotKit
const resources = await searchResourcesTool.execute({
    latitude: 38.5,
    longitude: -121.4,
    radiusMiles: 5,
});

console.log(`Found ${resources.length} resources`);
```

This allowed:
- **TDD**: Write tool tests before UI
- **Debugging**: Test tools in isolation
- **Regression Testing**: Ensure tools still work
- **Performance Testing**: Measure query times

## Challenges Faced

### Challenge 1: Stream Dropout
CopilotKit's built-in error handling fixed the blank message issue.
- Lesson: Use mature frameworks for their error handling

### Challenge 2: Context Size
Making too much state available to the AI bloated tokens.
- Solution: Limit `useCopilotReadable` to essential context
- Lesson: Context is expensive; be selective

### Challenge 3: Tool Output Variety
Different tools returned different schemas.
- Solution: Strict Zod typing for all tool results
- Lesson: Type safety enables safe renderer dispatch

## What Didn't Make It (Yet)

The team decided to defer:
- Voice input (complex, needed UI work)
- Streaming transcription
- Model selection UI
- Multi-turn memory optimization

These became future enhancements.

## The Impact

Chat-v2 became the **primary interface for discovery**:
- New users started in chat to learn about the app
- Returning users used chat for daily needs
- The AI became the brand personality

The team's voice—thoughtful, helpful, non-judgmental—shone through the AI responses.

## What We Learned

1. **Framework choice matters**. Picking CopilotKit over a DIY solution saved months of work on error handling, state management, and streaming fixes.

2. **Shared tool definitions scale**. By extracting tools to a single file, the team could:
   - Test independently
   - Version tools
   - Use tools in multiple contexts (CLI, API, chat)
   - Document in one place

3. **Context injection is powerful**. By making user location and preferences available to the AI, we unlocked personalization without explicit prompts.

4. **Type safety for AI outputs**. Using Zod to validate tool results prevented silent failures and enabled safe renderer dispatch.

## Up Next

With AI integration solid, the system had a hidden problem: **data quality**. Resources in the database had inaccurate hours, duplicate entries, and missing information. Phase 1 & 2 (Data Quality) would tackle this invisible infrastructure challenge.

---

**Key Commits**: `bda0fce` (chat refactor), `d614684` (layout fixes), `a22fbe5` (glassmorphism), PR #22

**Related Code**: `src/lib/ai-tools.ts`, `src/app/api/copilotkit/route.ts`, `src/app/chat-v2/`, `scripts/dev-terminal-chat.ts`
