# Contributing to TheFeed

Thank you for helping build TheFeed! This project extends the Agentic Coding Starter Kit. We prioritize dignity, safety, and strict typing across the codebase.

## Workflow

1. **Fork or clone** the repo and create a feature branch from `main`.
   ```bash
   git checkout -b feat/short-title
   ```
2. **Install dependencies** from **PowerShell** (see DEVELOPMENT.md for Windows/WSL guidance).
   ```powershell
   pnpm install
   ```
3. **Sync the database** if you are working on data, auth, or community features:
   ```bash
   pnpm run db:migrate
   pnpm exec tsx --env-file=.env scripts/seed-food-banks.ts
   ```
4. **Develop and verify locally**:
   - `pnpm dev` to run the app.
   - `pnpm lint` and `pnpm typecheck` before opening a PR.
5. **Commit with context** using concise, conventional messages (e.g., `feat: add RSVP quick action`).
6. **Open a Pull Request** against `main` and link relevant issues.

## Lightweight governance (subject to change)

- **Reviews**: At least one maintainer review is required before merge. For risky changes (data model, auth, payments), seek two reviewers when possible.
- **Issue-first**: For substantial features or refactors, open an issue or draft PR to align on scope before implementation.
- **Decision logs**: If you change architecture or flows, update context files (`context/state.md`, `context/decisions.md`).
- **Release style**: Trunk-based with small, incremental PRs preferred over large drops.

## Pull Request checklist

- [ ] Branch is up to date with `main`.
- [ ] `pnpm lint` and `pnpm typecheck` pass (or failures are explained).
- [ ] Tests or screenshots added when UI changes are visible.
- [ ] New env vars, scripts, or migrations are documented (README/DEVELOPMENT/context files).
- [ ] Linked to related issues and follows the Code of Conduct.

## Code style and safety

- Use TypeScript strictly; avoid `any` and prefer shared types.
- Follow shadcn/ui + Tailwind patterns with accessible defaults.
- Keep server components by default; add `"use client"` only when state or effects are required.
- Handle secrets responsibly—do not commit `.env*` or API keys.

## Reporting issues and asking questions

- Search existing issues first.
- Provide reproduction steps, environment info, and relevant logs/screenshots.
- Use the issue templates where available; for conduct concerns, see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Thanks again for contributing! 🚀
