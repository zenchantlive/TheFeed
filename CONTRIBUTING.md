# Contributing to FoodShare

Thanks for helping build FoodShare! This project extends the Agentic Coding Starter Kit, so we follow the same conventions with a few additions for the FoodShare roadmap.

## ⚡ Critical: Windows/WSL Hybrid Setup

This project uses a **Windows + WSL hybrid setup**:
- **PowerShell (Windows)**: Run dev server (`bun dev`), package management (`bun add/install`), and database operations.
- **WSL (Linux)**: Claude Code runs here for file operations and git commands. This is onyl relevant is you are on windows, and using CC with WSL.

### Package Management Rules

1. **ALWAYS use Bun**: We have migrated from pnpm.
2. **ALWAYS run from PowerShell**:
   ```powershell
   bun install
   bun add <package>
   bun run typecheck
   ```
3. **❌ NEVER run `bun install` from WSL**: This causes permission errors and breaks optional native dependencies.

## Development Workflow

1. **Fork / clone** the repo.
2. **Create a feature branch** from `main`.
   ```bash
   git checkout -b feat/map-search
   ```
3. **Install dependencies** (PowerShell):
   ```powershell
   bun install
   bun run db:generate
   bun run db:migrate
   bun run scripts/seed-food-banks.ts
   ```
4. **Develop & test locally**:
   - `bun dev` to run the app.
   - `bun run typecheck` before committing (**Mandatory**).
   - `bun run lint` (fix issues or run `bun lint --fix`).
5. **Commit with context**. Use short, descriptive messages, e.g. `fix: handle empty search results`.
6. **Push and open a Pull Request** against `main`, referencing any related GitHub issues.

## Pull Request Checklist

- [ ] Feature branch is up to date with `main`.
- [ ] `bun run typecheck` passes.
- [ ] `bun run lint` passes.
- [ ] New env vars or scripts are documented in `README.md`.
- [ ] UI changes include screenshots or GIFs in the PR description.
- [ ] Linked to the relevant GitHub issue(s).

## Commit Message Conventions

Use a simplified conventional commits style when possible:

- `feat: add saved locations list`
- `fix: prevent blank AI responses`
- `docs: update map troubleshooting`
- `chore: bump drizzle version`

## Troubleshooting Common Issues

### Dev server won't start
1. Check `.env` exists and has all required vars.
2. Check database connection (`POSTGRES_URL` should use port 6543 for pooler).
3. Delete `.next` folder and restart.

### Permission errors during install
- You are likely running `bun install` from WSL.
- **Solution**: Switch to Windows PowerShell and run it there.

### 500 errors on all pages
- Lock file might be out of sync.
- **Solution**: Run `bun install` in PowerShell.

## Reporting Issues

Before opening a new issue:

1. Search the existing issues.
2. Provide clear reproduction steps and environment info.
3. Attach logs or screenshots when relevant.

Use our GitHub issue templates to keep reports consistent.

## Code Style

- Follow existing Tailwind & shadcn patterns.
- Keep React components typed (`FC` is optional, but use explicit prop interfaces).
- Prefer server components unless client state is required.
- **NO `any` types**: Strict type safety is enforced.
- Avoid committing `.env*` files or secrets.

## Community Guidelines

We enforce our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and inclusive.

Thanks again for contributing! 🚀
