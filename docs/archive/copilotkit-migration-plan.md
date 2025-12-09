# CopilotKit Migration Plan - TheFeed Chat System

**Status:** Planning Phase
**Strategy:** Option A - Parallel Implementation (Safer)
**Estimated Time:** 12-20 hours
**Target:** Create `/chat-v2` with CopilotKit while keeping `/chat` functional

---

## Executive Summary

We are rebuilding the chat system using CopilotKit to solve the current "Maximum update depth exceeded" React error and provide a more robust, maintainable chat experience. The current implementation using Vercel AI SDK's `useChat` has state management issues causing infinite loops and blank assistant messages.

---

## Phase 0: Pre-Migration Preparation (1-2 hours)

### Research & Documentation

**Using CopilotKit MCP Server:**
```bash
# MCP tool available for CopilotKit documentation and code search
mcp__copilotkit-mcp__search-docs
mcp__copilotkit-mcp__search-code
```

**Key Documentation URLs to Reference:**
- Quickstart: https://docs.copilotkit.ai/direct-to-llm/guides/quickstart
- Self-hosting Runtime: https://docs.copilotkit.ai/direct-to-llm/guides/self-hosting
- Backend Actions: https://docs.copilotkit.ai/direct-to-llm/guides/backend-actions
- Frontend Actions: https://docs.copilotkit.ai/direct-to-llm/guides/frontend-actions
- Custom UI: https://docs.copilotkit.ai/direct-to-llm/custom-look-and-feel
- CopilotRuntime Reference: https://docs.copilotkit.ai/reference/classes/CopilotRuntime

**MCP Search Strategy:**
When implementing specific features, use the MCP tool first:
```bash
# Example searches for implementation guidance
search-docs "OpenRouter adapter configuration"
search-docs "backend actions tool definition"
search-code "OpenRouterAdapter example" --repo CopilotKit
```

If MCP search doesn't yield clear results, fallback to WebFetch on the documentation URLs above.

### Questions to Resolve

**Still Need to Figure Out:**

1. **OpenRouter Compatibility**
   - Does CopilotKit have a native OpenRouter adapter, or do we use `OpenAIAdapter` with OpenRouter base URL?
   - Search: `search-docs "OpenRouter provider configuration"`
   - Fallback: Check https://docs.copilotkit.ai/reference/classes/llm-adapters/OpenAIAdapter

2. **Tool Definition Format**
   - Current tools use Vercel AI SDK's `tool()` function
   - Need to understand CopilotKit's `actions()` format
   - Are parameters defined the same way (Zod schemas)?
   - Search: `search-docs "backend actions tool parameters zod"`
   - Fallback: https://docs.copilotkit.ai/direct-to-llm/guides/backend-actions

3. **Context Injection**
   - How to pass `userId`, `location`, and `radiusMiles` to CopilotKit runtime?
   - Is it via request body like current implementation?
   - Search: `search-docs "copilot runtime context user session"`
   - Fallback: Check CopilotRuntime reference docs

4. **Message Persistence**
   - Does CopilotKit handle message storage automatically?
   - Do we still need our `chatMessages` table?
   - Search: `search-docs "message persistence database storage"`

5. **Streaming Behavior**
   - How does CopilotKit handle partial tool call streaming?
   - Will tool status indicators work similarly?
   - Search: `search-docs "streaming tool calls status"`

### Installation Commands

```bash
# From Windows PowerShell (per user rules)
cd C:\Users\Zenchant\thefeed\foodshare
bun add @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

**Expected Dependencies:**
- `@copilotkit/react-core` - Core hooks and context
- `@copilotkit/react-ui` - Pre-built UI components
- `@copilotkit/runtime` - Backend runtime and adapters

**Check Compatibility:**
- Ensure Next.js 15 compatibility
- Check React 19 compatibility
- Verify no conflicts with existing `ai` package

---

## Phase 1: Backend Runtime Setup (4-6 hours)

### Step 1.1: Create CopilotKit API Route

**File:** `src/app/api/copilotkit/route.ts`

**Research Before Implementation:**
- Search: `search-code "CopilotRuntime OpenAIAdapter" --repo CopilotKit --limit 5`
- Review example: https://github.com/CopilotKit/CopilotKit/tree/main/examples/copilot-chat-with-your-data
- Check if OpenRouter needs special adapter or if we can use OpenAI adapter with base URL override

**Required Components:**
1. Import CopilotRuntime, appropriate adapter, endpoint helper
2. Configure adapter with OpenRouter credentials
3. Define runtime with actions (converted from current tools)
4. Create POST handler using `copilotRuntimeNextJSAppRouterEndpoint`

**Questions to Answer:**
- How to configure model selection (currently `process.env.OPENROUTER_MODEL`)?
- How to pass dynamic context (userId, location, radius) per request?
- Do we need `toolChoice: "auto"` equivalent?

### Step 1.2: Convert Tool Definitions to CopilotKit Actions

**Current Tools to Convert:**
1. `getUserContextTool` - Get user profile and saved locations
2. `searchResourcesTool` - Search food banks
3. `getResourceByIdTool` - Get single resource details
4. `searchPostsTool` - Search community posts
5. `searchEventsTool` - Search events
6. `getDirectionsTool` - Generate Google Maps URL
7. `logChatTool` - Log chat interaction

**Research Pattern:**
- Search: `search-docs "actions function definition parameters"`
- Look for examples with Zod schema validation
- Check how to access request context (userId, location) within action handlers

**Conversion Strategy:**
- Keep existing tool logic in `src/lib/ai-tools.ts`
- Create wrapper functions in CopilotKit actions format
- Maintain all Zod schemas
- Ensure distance calculations and filtering logic stays identical

**Open Questions:**
- Can we directly pass Vercel AI SDK tool objects, or do we need full rewrite?
- How to handle the location-constrained search pattern?
- How to inject session/context into action handlers?

### Step 1.3: Configure System Prompt

**Current System Prompt:** `src/lib/prompts/chat-system.ts` exports `buildSousChefSystemPrompt`

**Research:**
- Search: `search-docs "system prompt instructions runtime"`
- How does CopilotKit handle dynamic system prompts with context variables?

**Questions:**
- Pass system prompt in runtime configuration or per-request?
- Can we inject location/radius/userId into prompt template?

### Step 1.4: Test Backend with Terminal Script

**Create Test Script:** `scripts/test-copilotkit-backend.ts`

**Purpose:**
- Verify backend runtime responds correctly
- Test tool calling without UI complications
- Confirm OpenRouter model selection works

**Test Cases:**
1. Simple message without tool calls
2. Message triggering `get_user_context`
3. Message triggering `search_resources` with location
4. Message triggering multiple tools (search events + posts)
5. Verify streaming chunks arrive in order

**Success Criteria:**
- Backend responds without errors
- Tools execute and return expected data
- Streaming completes without dropping messages

---

## Phase 2: Frontend UI Setup (6-10 hours)

### Step 2.1: Create Chat V2 Route

**New Files:**
- `src/app/chat-v2/page.tsx` - Main page component (server component)
- `src/app/chat-v2/page-client.tsx` - Client component with CopilotKit
- `src/app/chat-v2/components/` - Custom components as needed

**Keep Parallel:**
- Original `/chat` route stays functional
- Can compare behavior side-by-side
- Easy rollback if issues arise

**Research:**
- Search: `search-docs "CopilotKit provider setup Next.js 15 app router"`
- Check React 19 compatibility notes

### Step 2.2: Configure CopilotKit Provider

**Where to Add:**
- Decide: Root `layout.tsx` or just `chat-v2` layout?
- Recommendation: Create `src/app/chat-v2/layout.tsx` to isolate during parallel phase

**Research:**
- Search: `search-docs "CopilotKit provider runtimeUrl configuration"`
- Check required provider props

**Configuration Needs:**
1. `runtimeUrl` - Point to `/api/copilotkit`
2. Optional: `publicApiKey` for Copilot Cloud features (not required for self-hosting)
3. Any additional context providers needed

**Questions:**
- Can we nest inside existing `AuthProvider` context?
- Any conflicts with current theme provider?

### Step 2.3: Implement Basic Chat UI

**Research:**
- Search: `search-docs "CopilotChat component props customization"`
- Review built-in components: `<CopilotChat>`, `<CopilotPopup>`, `<CopilotSidebar>`

**Implementation Decision:**
- Start with `<CopilotChat>` component for fastest implementation
- Evaluate if custom UI needed later

**Required Props/Config:**
1. System instructions (or handled by backend?)
2. Initial messages / welcome message
3. Placeholder text
4. Styling classes to match existing design

**Reuse from Current Implementation:**
- Chat header with location badge
- Suggested prompts component
- Composer styling patterns

**Questions:**
- Does `<CopilotChat>` support custom message renderer?
- How to customize bubble styles to match current design?
- Can we inject the location badge into the header?

### Step 2.4: Implement Context Injection

**User Context Needed:**
- Session user ID
- Detected location (lat/lng/label)
- Search radius (default 10 miles)

**Research:**
- Search: `search-docs "useCopilotReadable context injection"`
- Search: `search-docs "runtime request context body"`

**Possible Approaches:**
1. Use `useCopilotReadable` to provide context to AI
2. Pass in request body (similar to current implementation)
3. Some combination of both

**Questions to Resolve:**
- Which context should be "readable" (visible to AI in prompts)?
- Which should be passed silently in request metadata?
- How to update context when location changes (user clicks "Refresh")?

### Step 2.5: Implement Geolocation Hook

**Reuse:** `src/app/chat/hooks/use-resolved-location.ts`

**Integration:**
- Import hook in chat-v2 page
- Pass location to CopilotKit runtime
- Update header badge when location changes

**Question:**
- Does location change trigger re-render issues similar to current bug?
- How to prevent unnecessary re-submissions?

### Step 2.6: Add Tool Call Rendering (Generative UI)

**Current Tool Status Display:**
- Shows active tools with labels like "Searching nearby resources..."
- Uses `TOOL_STATUS_LABELS` mapping

**Research:**
- Search: `search-docs "useRenderToolCall backend tool rendering"`
- Search: `search-code "useRenderToolCall example"`

**Tools Requiring Custom Rendering:**

1. **search_resources**
   - Loading state: Show skeleton of resource cards
   - Complete state: Show count of results found
   - Visual: List preview or map marker count

2. **search_events**
   - Loading state: Calendar loading skeleton
   - Complete state: Show event count and date range
   - Visual: Mini event card previews

3. **search_posts**
   - Loading state: Post feed skeleton
   - Complete state: Show post count and types (shares vs requests)
   - Visual: Post preview cards

4. **get_directions**
   - Loading state: Map loading animation
   - Complete state: Show clickable Google Maps link
   - Visual: Static map preview (optional enhancement)

5. **get_user_context**
   - Silent (no UI needed, internal context gathering)

6. **get_resource_by_id**
   - Loading state: Detail card skeleton
   - Complete state: Full resource card

7. **log_chat**
   - Silent (no UI needed)

**Implementation Pattern:**
```
useRenderToolCall({
  name: "search_resources",
  render: ({ status, args, result }) => {
    // Return React component based on status
  }
})
```

**Questions:**
- Can we extract reusable card components from current `/community` page?
- How to handle tool calls that don't need rendering?
- Does rendering block AI response, or is it just visual?

### Step 2.7: Style Components to Match Design

**Current Design System:**
- Rounded corners (`rounded-3xl`)
- Muted color palette
- Border subtle (`border-border`)
- Background layers (`bg-background/60`, `bg-card/60`)
- Shadow minimal (`shadow-sm`)

**Research:**
- Search: `search-docs "customize styling CopilotChat tailwind"`
- Check if CopilotKit uses Tailwind or CSS modules

**Customization Areas:**
1. Message bubbles
2. Input composer
3. Tool call cards
4. Header/footer
5. Suggested prompts (if built-in)

**Questions:**
- Can we override default styles with Tailwind classes?
- Do we need to provide custom components, or just CSS?
- Does dark mode work automatically with our theme provider?

### Step 2.8: Add Suggested Prompts

**Current Prompts:**
```
- Find food nearby
- What's happening this week?
- How can I help?
- Show me the map
```

**Research:**
- Search: `search-docs "suggested prompts CopilotChat"`
- Check if built-in or custom component needed

**Questions:**
- Does `<CopilotChat>` support suggested prompts natively?
- How to hide after first user message?
- Can we customize icons and styling?

### Step 2.9: Implement Deep Link Support

**Current Features:**
- `?intent=hungry` - Auto-send hungry preset message
- `?intent=full` - Auto-send full preset message
- `?prefill=...` - Pre-fill composer with text

**Questions:**
- How to trigger auto-send on mount with CopilotKit?
- Use `useCopilotChat` hook for programmatic control?
- Will this cause similar re-render issues?

**Research:**
- Search: `search-docs "useCopilotChat programmatic send message"`

---

## Phase 3: Advanced Features & Polish (2-4 hours)

### Step 3.1: Message Persistence (Optional)

**Current Database:** `chatMessages` table exists but unclear if used

**Research:**
- Search: `search-docs "message persistence custom storage"`
- Check if CopilotKit provides hooks for save/load

**Questions:**
- Does CopilotKit auto-persist to database?
- Do we need to implement custom persistence layer?
- How to load conversation history on page load?

**Decision Point:**
- Implement now or defer to later phase?
- Is it critical for v2 launch?

### Step 3.2: Error Handling

**Error Scenarios:**
1. OpenRouter API failure
2. Database query timeout
3. Tool execution error
4. Network disconnection during streaming

**Research:**
- Search: `search-docs "error handling retry logic"`
- Check built-in error UI components

**Questions:**
- Does CopilotKit show error states automatically?
- Can we customize error messages?
- How to implement retry logic?

### Step 3.3: Loading States & Optimistic UI

**Current Implementation:**
- Shows tool status badges while processing
- "Streaming" status in composer

**Questions:**
- Are loading states built into `<CopilotChat>`?
- Can we customize loading indicators?
- Support for optimistic message rendering?

### Step 3.4: Accessibility

**Requirements:**
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

**Research:**
- Search: `search-docs "accessibility ARIA keyboard navigation"`

**Questions:**
- Is `<CopilotChat>` accessible by default?
- What additional ARIA labels do we need?

### Step 3.5: Testing Plan

**Test Scenarios:**

1. **Basic Chat Flow**
   - Send simple message, receive response
   - Verify streaming displays correctly
   - Check message ordering

2. **Tool Calling**
   - Each tool independently
   - Multiple tools in sequence
   - Multiple tools in parallel
   - Tool errors handled gracefully

3. **Location Context**
   - With location detected
   - Without location (ask user?)
   - Location refresh during conversation

4. **Deep Links**
   - `?intent=hungry` auto-sends
   - `?intent=full` auto-sends
   - `?prefill=text` pre-fills composer

5. **Edge Cases**
   - Empty message submission
   - Very long messages
   - Rapid message sending
   - Stop generation mid-stream
   - Offline/network error recovery

6. **Cross-Model Testing**
   - Anthropic Claude (currently working in terminal)
   - OpenRouter GPT models (currently failing early)
   - Verify tool calling works consistently

**Manual Testing Checklist:**
- [ ] Desktop browser (Chrome, Firefox, Safari)
- [ ] Mobile responsive design
- [ ] Dark mode toggle
- [ ] Session persistence
- [ ] Tool rendering for all 7 tools

**Automated Testing (Future):**
- Consider Playwright tests for critical flows
- Unit tests for tool conversion logic

---

## Phase 4: Migration & Deployment (2-3 hours)

### Step 4.1: Side-by-Side Comparison

**Testing Period:** 1-2 days

**Activities:**
1. Use both `/chat` and `/chat-v2` in parallel
2. Document any behavioral differences
3. Gather user feedback (if applicable)
4. Performance comparison (time to first token, total response time)

**Success Criteria:**
- Chat-v2 has no "Maximum update depth" errors
- All tools work correctly
- User experience is equal or better
- No regressions in functionality

### Step 4.2: Update Internal Links

**Pages Linking to Chat:**
- `/community` (mode toggle buttons - hungry/full intents)
- `/map` (future integration?)
- Navigation menu (if exists)

**Strategy:**
- Keep links pointing to `/chat` during parallel phase
- After successful migration, update to `/chat-v2`
- Or rename routes (Step 4.3)

### Step 4.3: Route Cutover

**When Confident Chat-V2 is Stable:**

**Option A: Swap Routes**
```bash
# Rename directories
mv src/app/chat src/app/chat-old
mv src/app/chat-v2 src/app/chat
```

**Option B: Route Redirect**
- Add redirect from `/chat` to `/chat-v2` in middleware
- Keep both routes available temporarily

**Option C: Delete Old Implementation**
- After thorough testing, remove `/chat` entirely
- Keep `/chat-old` in git history for reference

### Step 4.4: Update Documentation

**Files to Update:**
1. `context/state.md` - Update current AI chat status
2. `context/decisions.md` - Document decision to migrate to CopilotKit
3. `CLAUDE.md` - Update AI chat system architecture section
4. `README.md` (if exists) - Update development instructions

**New Documentation:**
- Add notes about CopilotKit usage
- Document any custom tool rendering patterns
- Update troubleshooting guide

### Step 4.5: Clean Up Dependencies

**After Migration Complete:**
```bash
# Remove old dependencies (if no longer needed)
bun remove @ai-sdk/react   # Check if used elsewhere first
# Keep `ai` package - might be used by CopilotKit
```

**Check for Unused Code:**
- Old chat components in `src/app/chat/components/`
- Unused hooks
- Legacy message normalization utilities

### Step 4.6: Performance Monitoring

**Metrics to Track:**
1. Time to first token (TTFT)
2. Total response time
3. Tool execution duration
4. Error rate
5. User session duration

**Tools:**
- Console logging (development)
- Future: Analytics integration
- Future: CopilotKit observability dashboard

---

## Open Questions & Decisions Needed

### High Priority (Block Implementation)

1. **OpenRouter Adapter Configuration**
   - Action: Search CopilotKit docs for OpenRouter examples
   - Fallback: Test if OpenAI adapter works with OpenRouter base URL
   - Decision needed before Phase 1

2. **Context Injection Pattern**
   - How to pass userId, location, radius to tools?
   - Action: Search for "runtime context" patterns
   - Decision needed before Phase 1.2

3. **Tool Definition Format**
   - Can we reuse existing Zod schemas?
   - Action: Compare tool examples in CopilotKit vs Vercel AI SDK
   - Decision needed before Phase 1.2

### Medium Priority (Affects Features)

4. **Message Persistence Strategy**
   - Built-in or custom implementation?
   - Action: Search docs for persistence hooks
   - Decision needed before Phase 3.1

5. **Custom UI vs Built-in Components**
   - Use `<CopilotChat>` or build custom with `useCopilotChat`?
   - Action: Test both approaches in PoC
   - Decision needed before Phase 2.3

6. **Tool Rendering Complexity**
   - Which tools need visual rendering?
   - How detailed should rendering be?
   - Decision needed before Phase 2.6

### Low Priority (Can Defer)

7. **Analytics Integration**
   - Track chat usage, tool calls, errors
   - Can be added post-launch

8. **Advanced Features**
   - Human-in-the-loop confirmations
   - Multi-agent conversations
   - Voice input
   - Defer to future phases

---

## Research Commands Reference

### Using MCP CopilotKit Server

```bash
# Search documentation
mcp__copilotkit-mcp__search-docs --query "your search query" --limit 10

# Search codebase examples
mcp__copilotkit-mcp__search-code --query "your search" --repo "https://github.com/CopilotKit/CopilotKit.git" --limit 10

# Example queries:
search-docs "OpenRouter configuration adapter"
search-docs "backend actions tool definition zod"
search-docs "CopilotKit provider Next.js app router"
search-docs "useRenderToolCall generative UI"
search-docs "message persistence storage"
search-docs "error handling retry"

search-code "CopilotRuntime actions" --repo CopilotKit
search-code "useRenderToolCall example" --repo CopilotKit
search-code "OpenAIAdapter configuration" --repo CopilotKit
```

### Fallback Documentation Links

If MCP search doesn't yield results, use WebFetch on these URLs:

**Core Guides:**
- https://docs.copilotkit.ai/direct-to-llm/guides/quickstart
- https://docs.copilotkit.ai/direct-to-llm/guides/self-hosting
- https://docs.copilotkit.ai/direct-to-llm/guides/backend-actions
- https://docs.copilotkit.ai/direct-to-llm/guides/frontend-actions

**API Reference:**
- https://docs.copilotkit.ai/reference/classes/CopilotRuntime
- https://docs.copilotkit.ai/reference/hooks/useCopilotChat
- https://docs.copilotkit.ai/reference/hooks/useRenderToolCall
- https://docs.copilotkit.ai/reference/components/chat/CopilotChat

**Examples:**
- https://github.com/CopilotKit/CopilotKit/tree/main/examples/copilot-chat-with-your-data
- https://github.com/CopilotKit/CopilotKit/tree/main/examples/coagents-starter

---

## Success Metrics

### Phase 1 Complete:
- [ ] Backend runtime responds to requests
- [ ] All 7 tools converted and execute successfully
- [ ] Terminal test script passes all test cases
- [ ] No errors in backend logs

### Phase 2 Complete:
- [ ] Chat UI renders without React errors
- [ ] Messages stream correctly without infinite loops
- [ ] Location context injects properly
- [ ] All tool calls trigger and display status

### Phase 3 Complete:
- [ ] Error states handled gracefully
- [ ] Loading indicators work correctly
- [ ] All test scenarios pass
- [ ] No "Maximum update depth" errors

### Phase 4 Complete:
- [ ] Chat-v2 route fully functional
- [ ] Documentation updated
- [ ] Old implementation removed or archived
- [ ] Performance metrics baseline established

---

## Timeline Estimate

| Phase | Task | Hours | Dependencies |
|-------|------|-------|--------------|
| 0 | Pre-Migration Research | 1-2 | None |
| 1.1 | Create API Route | 1-2 | Research complete |
| 1.2 | Convert Tools | 2-3 | API route structure |
| 1.3 | System Prompt | 0.5 | Tools converted |
| 1.4 | Backend Testing | 0.5-1 | Full backend ready |
| 2.1 | Create Chat-v2 Route | 0.5 | None |
| 2.2 | Configure Provider | 0.5 | Backend API ready |
| 2.3 | Basic Chat UI | 1-2 | Provider configured |
| 2.4 | Context Injection | 1 | Basic UI working |
| 2.5 | Geolocation | 0.5 | Context pattern decided |
| 2.6 | Tool Rendering | 2-4 | Chat UI functional |
| 2.7 | Styling | 1-2 | Components exist |
| 2.8 | Suggested Prompts | 0.5-1 | Basic chat working |
| 2.9 | Deep Links | 0.5-1 | Chat functional |
| 3.1 | Message Persistence | 1-2 | Optional |
| 3.2 | Error Handling | 0.5-1 | Basic flow working |
| 3.3 | Loading States | 0.5 | UI complete |
| 3.4 | Accessibility | 0.5-1 | UI complete |
| 3.5 | Testing | 1-2 | All features done |
| 4.1 | Side-by-Side | 0.5 | Both versions ready |
| 4.2 | Update Links | 0.5 | Testing complete |
| 4.3 | Route Cutover | 0.5 | Confidence high |
| 4.4 | Documentation | 1 | Migration complete |
| 4.5 | Cleanup | 0.5 | Documentation done |
| 4.6 | Monitoring | 0.5 | Deployed |
| **TOTAL** | | **12-20** | |

---

## Risk Mitigation

### Risk: OpenRouter Incompatibility
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:** Test OpenRouter early in Phase 1.1, fallback to OpenAI adapter with custom base URL

### Risk: Tool Conversion Errors
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Convert and test tools one at a time, keep terminal test harness

### Risk: React State Issues Persist
- **Likelihood:** Low (CopilotKit designed to prevent this)
- **Impact:** Critical
- **Mitigation:** Test extensively in Phase 2, monitor for any re-render loops

### Risk: UI Customization Limitations
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Research custom UI options early, fallback to headless mode if needed

### Risk: Performance Regression
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:** Benchmark both versions, optimize if needed

### Risk: Migration Takes Longer Than Estimated
- **Likelihood:** Medium
- **Impact:** Low (parallel implementation allows us to keep old version)
- **Mitigation:** Time-box each phase, defer optional features to post-launch

---

## Post-Migration Enhancements (Future Phases)

**Not in Initial Scope, Consider Later:**

1. **Human-in-the-Loop Confirmations**
   - Use `useHumanInTheLoop` for sensitive actions
   - Example: "Are you sure you want to share this location?"

2. **Multi-Agent Workflows**
   - Separate "event planner" agent
   - Separate "food finder" agent
   - CopilotKit supports agent orchestration

3. **Voice Input/Output**
   - Speech-to-text for accessibility
   - Text-to-speech for responses

4. **Conversation Summarization**
   - Summarize long conversations
   - Extract action items from chat

5. **Advanced Analytics**
   - Tool usage patterns
   - User satisfaction metrics
   - Common failure scenarios

6. **Mobile App Integration**
   - React Native compatibility
   - Push notifications for tool results

---

## Notes & Learnings

**Document Here as We Progress:**

- Any deviations from the plan
- Solutions to unexpected problems
- Performance insights
- User feedback
- API quirks or gotchas
- Useful resources found during implementation

---

**Last Updated:** 2025-01-11
**Status:** Ready to begin Phase 0
**Next Action:** Install CopilotKit dependencies and begin research phase
