# TheFeed Roadmap Implementation Prompts

> **How to use**: Copy the relevant block below and paste it into your AI coding assistant (Claude, Cursor, Windsurf, etc.) to execute that specific phase. The "Relevant Files" section tells the AI exactly what to read first.

---

## 📅 Q1: Event Creation Overhaul

**Title**: Refactor Event Creation to Single-Page Drawer
**Goal**: Replace the multi-step wizard with a fast, AI-ready sheet.

**Prompt**:
```markdown
Act as a Senior React Engineer. Refactor the Event Creation flow in `src/components/events/`.

**Relevant Files (Read These First)**:
- `context/state.md` (Project Context)
- `context/decisions.md` (UX Decisions)
- `src/lib/schema.ts` (Event Database Schema)
- `src/components/events/event-creation-wizard.tsx` (Current implementation to refactor)
- `src/components/ui/sheet.tsx` (shadcn/ui component)

**Context**:
Currently, we use a multi-step wizard which is cumbersome on mobile. We want to move to a single-page 'Sheet' or 'Drawer' pattern combined with `react-hook-form`.

**Requirements**:
1.  **Component**: Create `CreateEventDrawer.tsx`. Use `shadcn/ui` Sheet component.
2.  **Form**: Use `react-hook-form` + `zod` schema.
    - Fields: Title, Description, Type (Potluck/Volunteer), Date & Time, Location Name, Address, Capacity.
    - Validation: Date must be future. Title min 5 chars.
3.  **Visuals**: Use a "Glass" aesthetic consistent with the roadmap.
4.  **AI Pre-fill**:
    - Valid prop: `initialData?: Partial<EventSchema>`.
    - If this prop is passed, the form fields should populate automatically. This is for the AI agent to drive the UI.
5.  **State Management**: Use optimistic updates if possible, or standard Server Action submission (`createEvent`).

**Deliverables**:
- [ ] `CreateEventDrawer.tsx`
- [ ] Updated schema in `src/lib/schemas/event.ts`
- [ ] Integration into `src/components/nav/mobile-nav.tsx` (replacing the old + button link).
```

---

## 📅 Q1: Agentic Creation Tools

**Title**: Implement AI Content Creation Capabilities
**Goal**: Allow the AI to "Draft" complex content (Events, Posts) for the user.

**Prompt**:
```markdown
Act as a Full Stack Agentic Engineer. Upgrade the `src/lib/ai-tools.ts` and Chat UI to support "Generative Content Creation".

**Relevant Files (Read These First)**:
- `context/state.md` (Project Context)
- `src/lib/ai-tools.ts` (Current Tool Definitions)
- `src/lib/schema.ts` (DB Schema for Events/Posts)
- `src/app/chat-v2/components/tool-ui.tsx` (or current Chat UI implementation)
- `src/lib/queries.ts` (Existing data access patterns)

**Context**:
The current AI only "Reads" data. We need it to help users Create. We will use a "Drafting" pattern where the AI populates a form and opens it for the user to finalize.

**Requirements**:
1.  **New Tools**: Add the following tools to `ai-tools.ts`:
    - `create_draft_event`: Returns a structured event object. UI should render a "Draft Preview Card" with a "Edit & Publish" button that opens the `CreateEventDrawer` with `initialData`.
    - `create_draft_post`: Input `content`, `urgency`, `type`. Returns a structured post object. UI renders a "Draft Post Card" -> opens Post Dialog.
2.  **Chat UI**:
    - Update `src/app/chat-v2/components/tool-ui.tsx` (or equivalent) to handle these specific tool calls.
    - Ensure the "Tool Call" displays the interactive Draft Card.
3.  **Safety**:
    - No DB writes happen automatically. The Tool ONLY populates the Form. The USER click "Publish" in the form.

**Deliverables**:
- [ ] Updated `ai-tools.ts` with creation schemas.
- [ ] `DraftEventCard.tsx` (Chat Component).
- [ ] `DraftPostCard.tsx` (Chat Component).
```

---

## 📅 Q2: Monorepo & Expo Setup

**Title**: Initialize Turborepo & Expo Architecture
**Goal**: Set up the shared core for the Native Leap.

**Prompt**:
```markdown
Act as a DevOps/Architect. Refactor the implementation into a Turborepo Monorepo to support a future Mobile App.

**Relevant Files (Read These First)**:
- `context/info.md` (Architecture Vision)
- `package.json` (Current Dependencies)
- `src/lib/schema.ts` (To be moved to shared core)
- `tsconfig.json` (Current TS Config)

**Context**:
We currently have a single Next.js app. We want to add an Expo (React Native) app that shares Types, Schema, and Logic.

**Plan**:
1.  **Structure**:
    - `apps/web`: The current Next.js app.
    - `apps/mobile`: New Expo Router app.
    - `packages/core`: Shared logic.
2.  **Execution**:
    - Initialize Turborepo in the root.
    - Move `src/lib/schema.ts`, `src/lib/types/*`, and `src/lib/utils.ts` into `packages/core`.
    - Ensure `apps/web` imports from `@thefeed/core`.
    - Initialize `apps/mobile` with `npx create-expo-app`.
3.  **Compatibilty Check**:
    - Ensure `packages/core` does NOT import `server-only` or `next/*` specific code. It must be isomorphic.

**Deliverables**:
- [ ] `turbo.json` configuration.
- [ ] `packages/core` working and linked.
- [ ] `apps/web` running successfully with shared imports.
- [ ] `apps/mobile` booting up "Hello World".
```

---

## 📅 Q3: Automated Trust

**Title**: Implement AI Auto-Moderation Pipeline
**Goal**: Reduce manual moderation load.

**Prompt**:
```markdown
Act as a Backend Security Engineer. Implement an Automated Trust & Safety pipeline for posts.

**Relevant Files (Read These First)**:
- `context/state.md` (Current Status)
- `src/lib/schema.ts` (Posts Table definition)
- `src/middleware.ts` (If doing edge checks, otherwise Actions)
- `src/actions/*` (Where createPost logic resides)

**Context**:
We want to prevent toxic content from ever being visible, without requiring manual approval for every post.

**Requirements**:
1.  **Middleware/Action**: Logic inside `createPost` server action.
2.  **API Integration**: Call OpenAI Moderation API (or similar lightweight classifier) on the post content.
3.  **Logic**:
    - If `flagged` by API: Set `post.status = 'hidden'`, `post.moderationReason = categories`.
    - Notify user: "Your post is under review."
4.  **Admin View**: Create a simple page `/admin/moderation` fetching all `status='hidden'` posts for manual review/unban.

**Deliverables**:
- [ ] Moderation Check function in `src/lib/moderation.ts`.
- [ ] Update `createPost` action.
- [ ] Admin Review Page.
```
