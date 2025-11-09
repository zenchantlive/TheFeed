# Development Guide - TheFeed

## Critical: Windows/WSL Hybrid Setup

This project uses a **Windows + WSL hybrid setup**:
- **PowerShell**: Run dev server and package management
- **WSL**: Claude Code runs here for file operations

---

## Package Management Rules

### ⚠️ ALWAYS run from PowerShell (Windows):
```powershell
pnpm install
pnpm install <package-name>
pnpm add <package-name>
pnpm update
```

### ❌ NEVER run from WSL/Linux terminal:
```bash
# DON'T DO THIS - causes permission errors!
pnpm install
```

---

## If You Get 500 Errors After Reinstalling

If you accidentally deleted `pnpm-lock.yaml` and get 500 errors:

1. **Restore lock file** (from PowerShell or WSL):
   ```bash
   git checkout HEAD -- pnpm-lock.yaml
   ```

2. **Clean install** (PowerShell ONLY):
   ```powershell
   rm -rf node_modules, .next
   pnpm install --frozen-lockfile
   ```

3. **Restart dev server**:
   ```powershell
   pnpm dev
   ```

---

## When to Delete Build Artifacts

**Safe to delete** (forces fresh build):
- `.next` - Next.js build cache (always safe)

**Only delete if needed**:
- `node_modules` - Only if you have dependency issues
- `pnpm-lock.yaml` - **NEVER** unless intentionally upgrading all packages

**Quick clean build**:
```powershell
rm -rf .next
pnpm dev
```

---

## Daily Development Workflow

1. **Morning**: Pull latest code (PowerShell or WSL)
   ```bash
   git pull
   ```

2. **Check for dependency changes**:
   ```bash
   git diff HEAD@{1} pnpm-lock.yaml
   ```

3. **If lock file changed**, reinstall (PowerShell):
   ```powershell
   pnpm install
   ```

4. **Start dev server** (PowerShell):
   ```powershell
   pnpm dev
   ```

5. **Code changes**: Claude Code (WSL) handles file edits ✅

6. **Before committing**:
   ```bash
   pnpm lint && pnpm typecheck
   ```

---

## Troubleshooting

### Dev server won't start
1. Check `.env` exists and has all required vars
2. Check database connection (POSTGRES_URL)
3. Delete `.next` and restart

### TypeScript errors after pull
```bash
rm -rf .next
# Restart dev server
```

### Permission errors during install
- You're running `pnpm install` from WSL instead of PowerShell
- Solution: Run from PowerShell

### 500 errors on all pages
- Lock file was deleted or wrong versions installed
- Solution: Restore lock file + clean install (see above)

---

## Database Operations

**Safe from either WSL or PowerShell**:
```bash
pnpm run db:generate   # Create migration files
pnpm run db:migrate    # Apply migrations
pnpm run db:studio     # Open Drizzle Studio
```

---

## Git Operations

**Safe from either WSL or PowerShell**:
```bash
git status
git add .
git commit -m "message"
git push
```

---

## Claude Code Configuration

Claude Code runs in WSL and can safely:
- Read/write source files
- Run git commands
- Run typecheck/lint
- Generate/apply database migrations

Claude Code should NOT:
- Run `pnpm install` (permission issues)
- Modify `pnpm-lock.yaml` directly
