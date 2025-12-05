# TypeScript Coding Standards for TheFeed

**Last Updated:** 2025-12-04
**Context:** Standards to prevent regression after fixing 50+ TypeScript errors.

## Core Principle: Type Safety First
**NEVER ship code with TypeScript errors.** Run `bun run typecheck` before every commit.

---

## 1. No Explicit `any` Types
### ❌ NEVER:
```typescript
const updateData: any = { ...data };
```
### ✅ ALWAYS:
```typescript
const updateData: Partial<typeof foodBanks.$inferSelect> = { ...data };
// Use type assertion ONLY for SQL conflicts
(updateData as Record<string, unknown>).geom = sql`...`;
```

## 2. Remove Unused Variables & Imports
**Why:** Unused items cause build failures.
**Check:** `bun run typecheck` shows all unused variables.

## 3. Match Component Props
### ❌ NEVER:
Passing props not defined in the component's type (e.g., `<EventCard userLocation={...} />` when `userLocation` isn't a prop).
### ✅ ALWAYS:
Remove unused props from both the component definition AND all call sites.

## 4. Export All Used Types
**Rule:** If a type is used in >1 file, export it.

## 5. Next.js 15: Async Params & Headers
### ❌ WRONG (Next.js 14):
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Error!
}
```
### ✅ CORRECT (Next.js 15):
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Must await!
}
// Same for headers(): const headerList = await headers();
```

## 6. Higher-Order Functions (HOF)
### ❌ WRONG:
Wrapping the *body* of the handler.
```typescript
export async function POST(req) {
  return withAdminAuth(req, async () => { ... });
}
```
### ✅ CORRECT:
Wrapping the *definition* of the handler.
```typescript
export const POST = withAdminAuth(async (req, context) => { ... });
```

## 7. Zod Schemas & Interfaces
**Rule:** TypeScript interfaces must match Zod schemas exactly.
If `verificationInfoSchema` has `jobTitle`, the `ClaimSubmissionBody` interface must also have it.

## 8. Workflow for Speed
1.  **`bun run typecheck`** (Fast, 2-5s) - Use this constantly.
2.  **`bun run lint`** (Medium) - Check before commit.
3.  **`bun run build`** (Slow) - Final verification only.

## 9. Drizzle Schema Updates
1.  Update `src/lib/schema.ts`
2.  `bun run db:generate`
3.  `bun run typecheck` to catch breaking changes.

---

## Pre-Commit Checklist
1.  `bun run typecheck`
2.  `bun run lint`
3.  `bun run build` (if above pass)
