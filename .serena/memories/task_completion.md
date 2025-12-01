# Task completion checklist
- Run `pnpm lint` and `pnpm typecheck`; ensure both pass.
- Run relevant feature-specific tests if added (Jest not heavily used yet).
- For DB schema changes, run `pnpm run db:generate` + `pnpm run db:migrate` and commit migration files.
- Verify key flows manually if affected (map, chat, community pages, auth redirects).
- Summarize changes and note any follow-up or known limitations.
- Avoid reverting user changes; keep edits scoped to the task.