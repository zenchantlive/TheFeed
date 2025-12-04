# TypeScript Coding Standards for TheFeed

**Last Updated:** 2025-12-04
**Context:** After fixing 50+ TypeScript errors across the codebase, these standards prevent regression.

---

## Core Principle: Type Safety First

**NEVER ship code with TypeScript errors.** Run `bun run typecheck` before every commit.

---

## 1. No Explicit `any` Types

### ❌ NEVER DO THIS:
```typescript
const updateData: any = { ...data };
const result: any = await fetchData();
function processItem(item: any) { }
```

### ✅ ALWAYS DO THIS:
```typescript
// Use Drizzle's inferred types
const updateData: Partial<typeof foodBanks.$inferSelect> = { ...data };

// Use proper return types
const result: FoodBank[] = await fetchData();

// Define explicit types
function processItem(item: FoodBankItem) { }

// When SQL types conflict, use type assertion (last resort)
(updateData as Record<string, unknown>).geom = sql`...`;
```

**Why:** TypeScript errors like `@typescript-eslint/no-explicit-any` break builds. Always use:
- Drizzle's `$inferSelect` and `$inferInsert` for database types
- Explicit interfaces/types for complex objects
- Type assertions only when absolutely necessary (e.g., SQL operations)

---

## 2. Remove Unused Variables & Imports

### ❌ NEVER DO THIS:
```typescript
import { type SQL } from "drizzle-orm"; // Imported but never used

function EventGrid({ events, userLocation }: Props) {
  // userLocation never used in function body
}
```

### ✅ ALWAYS DO THIS:
```typescript
// Only import what you use
import { eq, sql } from "drizzle-orm";

// Only declare props you actually use
function EventGrid({ events }: Props) {
  // Only events is used
}
```

**Why:** Unused imports/variables cause `@typescript-eslint/no-unused-vars` warnings that fail builds.

**How to Check:**
```bash
bun run typecheck  # Shows all unused variables
```

---

## 3. Match Component Props with Type Definitions

### ❌ NEVER DO THIS:
```typescript
// Component definition
function MyComponent({ name }: { name: string }) { }

// Usage - passing extra props
<MyComponent name="foo" age={25} />  // age not in type!
```

### ✅ ALWAYS DO THIS:
```typescript
// Define props type
type MyComponentProps = {
  name: string;
  age?: number; // Optional if not always needed
};

function MyComponent({ name, age }: MyComponentProps) { }

// Usage matches definition
<MyComponent name="foo" age={25} />
```

**Why:** Passing props that don't exist in the component's type definition causes build failures.

**When Removing Props:**
1. Remove from the type definition
2. Remove from the component parameters
3. Search codebase for all usages: `grep -r "ComponentName" src/`
4. Remove prop from ALL call sites

---

## 4. Export All Used Types

### ❌ NEVER DO THIS:
```typescript
// types.ts
type HotItem = { id: string; title: string; };  // Not exported!

// another-file.tsx
import type { HotItem } from "./types";  // ERROR: not exported!
```

### ✅ ALWAYS DO THIS:
```typescript
// types.ts
export type HotItem = { id: string; title: string; };

// another-file.tsx
import type { HotItem } from "./types";  // ✅ Works!
```

**Why:** Missing exports cause `Module has no exported member` errors.

**Rule:** If a type is used in more than one file, it must be exported.

---

## 5. Handle SQL/Drizzle Geometry Types Correctly

### ❌ NEVER DO THIS:
```typescript
const updateData: Partial<typeof foodBanks.$inferSelect> & { geom?: SQL } = {};
updateData.geom = sql`ST_SetSRID(...)`;  // Type conflict!
```

### ✅ ALWAYS DO THIS:
```typescript
// Don't extend the type with geom
const updateData: Partial<typeof foodBanks.$inferSelect> = {};

// Use type assertion for SQL operations
(updateData as Record<string, unknown>).geom = sql`ST_SetSRID(...)`;
```

**Why:** Drizzle's geometry types with `mode: "xy"` expect `{ x: number; y: number }`, but SQL operations return `SQL<unknown>`. Type assertion bypasses this safely.

---

## 6. Use Typecheck, Not Build, for Fast Feedback

### ❌ SLOW WORKFLOW:
```bash
bun run build  # 15-30 seconds, shows errors one file at a time
# Fix error
bun run build  # Another 15-30 seconds
# Fix error
bun run build  # ...repeat 10+ times
```

### ✅ FAST WORKFLOW:
```bash
bun run typecheck  # 2-5 seconds, shows ALL errors at once
# Fix all errors
bun run lint       # Check linting
bun run build      # Final verification
```

**Why:** `typecheck` runs `tsc --noEmit` which is much faster and shows all errors simultaneously.

**Daily Workflow:**
```bash
# Before starting work
bun run typecheck && bun run lint

# After making changes
bun run typecheck

# Before commit
bun run typecheck && bun run lint && bun run build
```

---

## 7. Async Params in Next.js 15 Route Handlers

### ❌ WRONG (Next.js 14 pattern):
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;  // Error in Next.js 15!
}
```

### ✅ CORRECT (Next.js 15 pattern):
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await!
}
```

**Why:** Next.js 15 made route params async. Must use `Promise<>` type and `await`.

---

## 8. Component Prop Changes Require Full Codebase Search

### When modifying a component's props:

1. **Update the type definition**
   ```typescript
   type MyComponentProps = {
     name: string;
     // age: number;  // Removing this
   };
   ```

2. **Update the component**
   ```typescript
   function MyComponent({ name }: MyComponentProps) {
     // Removed age parameter
   }
   ```

3. **Find ALL usages**
   ```bash
   grep -r "MyComponent" src/
   # or
   bun run typecheck  # Will show all call sites with errors
   ```

4. **Update every call site**
   ```typescript
   // Before
   <MyComponent name="foo" age={25} />

   // After
   <MyComponent name="foo" />
   ```

**Why:** Forgetting even ONE call site breaks the build.

---

## 9. Drizzle Schema Updates

### When adding fields to database tables:

1. **Update `src/lib/schema.ts`**
   ```typescript
   export const foodBanks = pgTable("food_banks", {
     // ...existing fields
     newField: text("new_field"),  // Add new field
   });
   ```

2. **Generate migration**
   ```bash
   bun run db:generate
   ```

3. **Update type imports**
   ```typescript
   // Types auto-update, but check usages
   const resource: typeof foodBanks.$inferSelect = {
     // newField is now available
   };
   ```

4. **Run typecheck**
   ```bash
   bun run typecheck  # Ensure no breakage
   ```

---

## 10. Pre-Commit Checklist

**MANDATORY before every commit:**

```bash
# 1. Check types (2-5 seconds)
bun run typecheck

# 2. Check linting (5-10 seconds)
bun run lint

# 3. Full build (only if above pass)
bun run build
```

**If any command fails, DO NOT COMMIT.**

**Why:** Prevents pushing broken code to production.

---

## Quick Reference Card

| Error Type | Fix |
|------------|-----|
| `@typescript-eslint/no-explicit-any` | Use proper types, never `any` |
| `@typescript-eslint/no-unused-vars` | Remove unused imports/variables |
| `Property 'X' does not exist` | Add prop to type definition |
| `Module has no exported member 'X'` | Export the type |
| `Type 'X' is not assignable to 'Y'` | Check Drizzle types, use assertion for SQL |
| `Cannot find module 'X'` | Run `bun install` from PowerShell |

---

## Tools & Commands

```bash
# Fast type checking (use this most often)
bun run typecheck

# Linting
bun run lint

# Both together
bun run typecheck && bun run lint

# Full build (slower, but final verification)
bun run build

# Auto-fix linting issues
bun run lint --fix
```

---

## Notes

- **Migration from pnpm to Bun:** Always run `bun install` from Windows PowerShell, not WSL
- **Icon Libraries:** Pin versions in package.json to avoid auto-upgrades breaking builds
- **Context Files:** Update `context/state.md` after major changes

---

## When in Doubt

1. Run `bun run typecheck` to see all errors
2. Fix them systematically
3. Run again to verify
4. Only then run `bun run build`

**Speed matters.** Type errors caught early = faster development.
