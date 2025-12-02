# Insights & Findings
Last updated: 2025-11-16 05:30 UTC

- 2025-11-16 — **CopilotKit duplicate streams cause blank assistant bubbles**  
  - When the backend retries an action, `useCopilotChatHeadless_c` sometimes emits two overlapping assistant messages, leaving the rendered bubble empty. Need to log chunk lifecycle (`onFinish`, `onError`) before promoting `/chat-v2` to default.

- 2025-11-16 — **`onlyWithCoords=true` is required for performant map posts**  
  - Pulling all posts into `/map` swamps the payload and surfaces items without location consent. Filtering at the query (`isNotNull(posts.locationCoords)`) keeps the payload <50 items and ensures privacy.

- 2025-11-16 — **Lucide React 0.539.0 misses several icon modules on Windows installs**  
  - Turbopack entered an infinite "module not found" loop. Downgrade to `lucide-react@0.538.0 --save-exact` from PowerShell, delete `.next`, and restart `pnpm dev` to restore the build. Keep installs out of WSL so Next SWC binaries remain Windows-compatible.

- 2025-11-16 — **Quick RSVP needs strict guest-count guardrails**  
  - Inline RSVP is limited to 1-5 guests; larger parties should use the full event page. Prevents abuse and keeps the popup UI simple. API already enforces capacity/waitlist messaging.

- 2025-11-16 — **Discovery filters must initialize from URL params**  
  - `MapPageClient` reads `eventType`/`postKind` from `useSearchParams()` once; we need to sync discovery context whenever query params change (e.g., using `useEffect` + router) to handle repeated deep links.

- 2025-11-18 — **Strict Schema Validation for LLM Providers**
  - Providers like OpenRouter (Azure OpenAI) enforce strict JSON schema validation where all properties must be required. Using `.optional()` in Zod causes API errors ("Missing property..."). The fix is to use `.nullable()` instead, which forces the LLM to explicitly return `null` for missing data.

- 2025-11-18 — **Streaming is mandatory for batch AI processing**
  - Processing 20+ search results with an LLM takes >60s, causing timeouts in standard HTTP handlers. Switching to a streaming response (NDJSON) with `ReadableStream` allows infinite duration tasks while keeping the user informed via progress bars.

- 2025-11-18 — **LLMs are bad at coordinates**
  - Extracted addresses from Tavily often lack coordinates. Relying on LLMs to hallucinate lat/lng is unsafe. The robust solution is a dedicated geocoding step (Mapbox API) before database insertion to prevent "Null Island" placement.
- 2025-11-19 — **Missing address is the main blocker for map-quality resources**
  - Discovery imports frequently arrive with blank street/city fields or `(0,0)` coordinates. The new admin dashboard exposes an explicit "Address" missing filter and highlights these entries so we can prioritize fixes before anything reaches `/map`.
- 2025-11-19 — **OpenRouter requires every JSON schema branch to list `required` props**
  - Even when nesting optional fields inside `updates`, Azure's OpenAI proxy returns `Invalid schema for response_format … Missing 'phone'`. We must either move optional data to a string field (e.g., `hours: string`) or restructure the schema so each nested object includes `required = [...]`. Current error surfaced via `/api/admin/resources/[id]/enhance?field=phone`.
