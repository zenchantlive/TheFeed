# Contributing to FoodShare

Thanks for helping build FoodShare! This project extends the Agentic Coding Starter Kit, so we follow the same conventions with a few additions for the FoodShare roadmap.

## Development Workflow

1. **Fork / clone** the repo.
2. **Create a feature branch** from `main`.
   ```bash
   git checkout -b feat/map-search
   ```
3. **Install dependencies** and sync the database if you haven't already:
   ```bash
   pnpm install
   pnpm run db:migrate
   pnpm exec tsx scripts/seed-food-banks.ts
   ```
4. **Develop & test locally**:
   - `pnpm dev` to run the app.
   - `pnpm typecheck` before committing.
   - `pnpm lint` (fix issues or run `pnpm lint --fix`).
5. **Commit with context**. Use short, descriptive messages, e.g. `fix: handle empty search results`.
6. **Push and open a Pull Request** against `main`, referencing any related GitHub issues.

## Pull Request Checklist

- [ ] Feature branch is up to date with `main`.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm lint` passes.
- [ ] New env vars or scripts are documented in `README.md`.
- [ ] UI changes include screenshots or GIFs in the PR description.
- [ ] Linked to the relevant GitHub issue(s).

## Commit Message Conventions

Use a simplified conventional commits style when possible:

- `feat: add saved locations list`
- `fix: prevent blank AI responses`
- `docs: update map troubleshooting`
- `chore: bump drizzle version`

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
- Avoid committing `.env*` files or secrets.

## Community Guidelines

We enforce our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and inclusive.

Thanks again for contributing! 🚀
