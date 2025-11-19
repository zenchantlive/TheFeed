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
