# Style and conventions
- Language: TypeScript + React (Next.js App Router). Prefer typed props and avoid `any`; use specific unions or `unknown` + narrowing.
- Linting: `eslint.config.mjs` extends `next/core-web-vitals` and `next/typescript`; obey `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `react-hooks/exhaustive-deps`, `@next/next/no-img-element`, etc. Remove unused imports/vars or prefix with `_`.
- Components: Prefer Next `<Image>` over raw `<img>` for remote assets; keep hooks dependency arrays accurate; keep client components marked with `"use client"` as needed.
- Styling: TailwindCSS utility classes; small shared UI pieces in `src/components/ui` and domain components under route folders.
- Data: Normalize resource data via helpers in `src/lib/resource-normalizer.ts`; use Drizzle types for database entities and avoid loose shapes.
- Comments: Keep concise; favor readable code over heavy comments.