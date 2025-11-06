# Git & Workflow Guidelines
Last updated: 2025-01-11 23:30 UTC

## Branching
- Work from feature branches off `main`.
- Naming: `feat/<topic>`, `fix/<issue#>-<topic>`, `chore/<task>`.
- Keep branches focused on a single issue/task.

## Commits
- Use clear messages, prefer conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Reference GitHub issue numbers in commit body when applicable (`Refs #2`).
- Run `pnpm typecheck` and `pnpm lint` before committing.

## Pull Requests
- Target `main`. Keep PRs small, reviewable.
- Include summary, testing notes, screenshots when UI changes.
- Link relevant issue (`Closes #3`).
- Ensure `context/` files updated before merge.

## Issues & Project Board
- Create issues for every meaningful task/bug (use templates).
- Apply labels (`phase:1`, `bug`, `ai`, etc.) and milestone.
- Add issue to FoodShare Roadmap project (https://github.com/users/zenchantlive/projects/2) and set Status.
- Update issue progress in comments; close when merged.

## Context Logs
- After finishing a work block:
  - Update `context/state.md` (active tasks, last action, next steps).
  - Add new findings to `context/insights.md`.
  - Note decisions in `context/decisions.md`.
  - Adjust `context/info.md` roadmap if scope shifts.
- Treat logs as mandatory memory—no undocumented changes.

## Releases
- Phase milestones (Phase 1 MVP, etc.) tracked via GitHub milestones/board.
- Tag releases once milestone issues closed (future process TBD).

## Environment
- Keep `.env` private; document required vars in README.
- Use `pnpm exec tsx --env-file=.env scripts/...` for scripts.

## Checklist before marking issue done
1. Code pushed and PR merged.
2. Issue closed with resolution summary.
3. Project board card moved to `Done`.
4. Context logs updated.
