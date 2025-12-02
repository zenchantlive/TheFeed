# Development Guide - TheFeed

This guide keeps local environments consistent while we prepare the project for open source. It balances the required Windows/WSL workflow with a predictable pnpm + Next.js toolchain.

## Platform setup

- **PowerShell (Windows)**: Use for package management and running the dev server. This avoids native dependency issues noted in AGENT.md.
- **WSL/Linux**: Safe for editing files, running lint/typecheck/tests, git operations, and database commands.

## Quick start

1. Copy `.env.example` to `.env` and fill in secrets (Supabase, Mapbox, OpenRouter, Better Auth). Keep secrets out of git.
2. Install dependencies **from PowerShell only**:
   ```powershell
   pnpm install
   ```
3. Run migrations and seed sample data (WSL or PowerShell):
   ```bash
   pnpm run db:migrate
   pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts
   ```
4. Start the app (PowerShell):
   ```powershell
   pnpm dev
   ```
5. Before committing, verify locally (WSL or PowerShell):
   ```bash
   pnpm lint
   pnpm typecheck
   ```

## Package management rules

- ✅ Run `pnpm install`, `pnpm add`, `pnpm update` **only from PowerShell**.
- ❌ Do **not** run those commands from WSL/Linux. It can corrupt native dependencies or the lockfile.
- Keep `pnpm-lock.yaml` under version control; never delete it unless intentionally upgrading all deps.

## Database operations

Safe from either PowerShell or WSL:

```bash
pnpm run db:generate   # Create migration files
pnpm run db:migrate    # Apply migrations
pnpm run db:push       # Push schema to the database
pnpm run db:studio     # Open Drizzle Studio
pnpm run db:reset      # Reset dev database (use with care)
```

## Day-to-day workflow

1. Pull latest changes: `git pull`.
2. Check if `pnpm-lock.yaml` changed. If yes, reinstall deps from PowerShell: `pnpm install --frozen-lockfile`.
3. Run `pnpm dev` from PowerShell and iterate in your editor (WSL is fine for file edits).
4. Keep branches small and focused; update context files when architecture or flows change.
5. Run `pnpm lint && pnpm typecheck` before pushing. Add screenshots when UI is visibly different.

## Troubleshooting

- **Dev server fails to start**: Ensure `.env` is present, database URL is reachable, and try clearing `.next`.
  ```bash
  rm -rf .next
  pnpm dev   # run from PowerShell
  ```
- **TypeScript errors after pulling**: Clear `.next` and restart the dev server.
- **Permission/native errors during install**: You probably ran `pnpm install` from WSL. Delete `node_modules`, restore `pnpm-lock.yaml`, then reinstall from PowerShell.
  ```powershell
  rm -rf node_modules .next
  pnpm install --frozen-lockfile
  ```
- **Unexpected 500s everywhere**: Restore `pnpm-lock.yaml` and reinstall from PowerShell.

## Git and review hygiene

- Use concise, conventional commit messages.
- Keep PRs small and linked to issues. Include a summary of behavior and testing steps.
- Do not commit `.env*`, secrets, or generated artifacts from `.next`.

## Tooling reminders

- Use pnpm exclusively.
- Prefer server components; add `"use client"` only when needed.
- Keep types strict; avoid `any` and reuse shared schema/types.
