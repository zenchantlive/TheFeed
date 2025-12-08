# AGENT.md

**CRITICAL INSTRUCTIONS FOR AI ASSISTANTS**

This file defines the **rules of engagement** for this repository (`TheFeed`). You MUST follow these directives significantly.

## 1. User Rules (NON-NEGOTIABLE)

1.  **Package Manager**: Use `bun` exclusively.
    *   ✅ `bun install`, `bun add`, `bun run dev`
    *   ❌ `pnpm`, `npm`, `yarn`
2.  **Environment**: Run all commands from **Windows PowerShell**.
    *   Do NOT use WSL (Windows Subsystem for Linux).
    *   This ensures native optional dependencies (like `@next/swc-win32-x64`) are correctly installed.
3.  **Strict Type Safety**:
    *   **NEVER** use `any`. Use `unknown` or define the proper interface.
    *   **ALWAYS** run `bun run typecheck` before confirming a task or committing.
    *   **ALWAYS** fix lint errors immediately.
    *   **Pre-Commit Routine**: `bun run typecheck && bun run lint && bun run build`.

## 2. Project Architecture

*   **Framework**: Next.js 15 (App Router), React 19, TypeScript.
*   **Database**: Supabase (PostgreSQL) + Drizzle ORM (`src/lib/schema.ts` is the single source of truth).
*   **Auth**: Better Auth (`src/lib/auth.ts`, `src/components/auth/auth-modal-context.tsx`).
*   **AI**: CopilotKit v2 (`src/app/chat-v2/`), Vercel AI SDK.
*   **Maps**: Mapbox GL (`src/app/map/`).

## 3. Key Context Files

Before starting work, **READ** these files in `context/` to understand the state of the world:

*   `context/state.md`: **Use this!** It tracks the current sprint, active phases, and what was just completed.
*   `CLAUDE.md`: Detailed technical documentation, file structure, and specific coding patterns.
*   `context/rules/typescript-standards.md`: The law for TypeScript code in this repo.

## 4. Development Workflow

1.  **Read** `context/state.md`.
2.  **Plan**: If complex, create `implementation_plan.md`.
3.  **Code**:
    *   Keep components small (<300 lines).
    *   Use `page.tsx` for data fetching (Server) and `page-client.tsx` for interaction (Client).
    *   Use `src/lib/schema.ts` for established types.
4.  **Verify**:
    *   `bun run typecheck` (Fast, 2-5s).
    *   `bun run lint`.
    *   Manual verification of flows.
5.  **Document**: Update `context/state.md` with your contributions.

## 5. Common Pitfalls

*   **Auth Redirects**: Do **NOT** use `router.push('/login')`. Use `useAuthModal()` context to open the glassmorphic modal.
*   **Navigation**: Use `router.push` (Next.js) instead of `window.open` for internal links.
*   **Icons**: Pin `lucide-react` versions to avoid breakage.
*   **Chat**: Do NOT touch `/chat` (legacy). Work in `/chat-v2`.

---
*Reference `CLAUDE.md` for deep technical details.*