# Lucide React Missing Icon Modules

## What Happened
- After reinstalling dependencies from Windows (required because WSL installs pull Linux-native binaries), Turbopack started hanging while compiling `/chat`.
- The dev server logs showed repeated `Module not found` errors pointing inside `node_modules/.pnpm/lucide-react@0.539.0_react@19.1.0/node_modules/lucide-react/dist/esm/lucide-react.js`.
- That build of `lucide-react` re-exported several icon modules such as `./icons/parking-meter.js`, but those files were missing from the published package, so Next.js kept retrying the build and never finished.

## How We Fixed It
1. Confirmed the icon files truly were absent by inspecting `node_modules/.pnpm/lucide-react@0.539.0.../dist/esm/icons` (only `parking-square*` existed).
2. Removed the broken package directory (`node_modules/next` was also reinstalled earlier because its CLI binary was missing).
3. Reinstalled the dependency stack from **PowerShell** (`pnpm add lucide-react@0.538.0 --save-exact`), pinning to the latest version that still ships the complete icon set.
4. Deleted `.next` to clear the stale Turbopack cache and restarted `pnpm dev --turbopack`. Compilation completed immediately.

## How to Resolve If It Reoccurs
1. Look at the failing import path in the Next.js error (e.g., `./icons/<name>.js`).
2. Inspect `node_modules/.pnpm/lucide-react@<version>/node_modules/lucide-react/dist/esm/icons` to see whether the file exists.
3. If it is missing, install a known-good version:
   ```powershell
   pnpm add lucide-react@0.538.0 --save-exact
   Remove-Item -Recurse -Force .next
   pnpm dev --turbopack
   ```
4. Once the Lucide project publishes a patched release, update to that specific patch and repeat the clean build.

## How to Prevent It
- Always run `pnpm install`/`pnpm add`/`pnpm dev` from **Windows PowerShell**, never from WSL, so that optional native dependencies (Next SWC, lightningcss, etc.) are installed for Windows only.
- Pin icon-library versions in `package.json` instead of using wide `^` ranges; that avoids picking up broken builds automatically.
- When upgrading `lucide-react`, test the dev server immediately and keep `.next` clean so regressions surface quickly.
