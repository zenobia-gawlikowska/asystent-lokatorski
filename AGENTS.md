# Repository Guidelines

Asystent Lokatorski is a tile-based decision wizard for KOPL (Komitet Obrony Praw Lokatorów) that routes tenants to the correct Polish legal document template given city, case type, and stage. Stack: Astro 6 + React 19 + TypeScript + Tailwind CSS 4, deployed to Cloudflare Pages.

## Hard rules

- No authentication or server-side user state. All Supabase auth scaffolding was deliberately removed — the app collects no PII.
- Every UI-visible string must be typed as `LocalizedString` (defined in `@src/data/types.ts`). The app supports 6 languages (pl/ua/ru/en/es/fr); hard-coded Polish strings in UI components are a convention violation.
- Document files under `public/documents/` are always Polish-language. Only UI labels are localized.

## Project structure

`src/data/` — decision tree types (`@src/data/types.ts`) and Warsaw seed data (`@src/data/tree.ts`). To add a city, case type, stage, or document: edit `tree.ts` and drop the `.docx` into `public/documents/<city-id>/`. `src/components/` — Astro and React components. `src/pages/` — Astro routes. `src/layouts/Layout.astro` — single layout shell. `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).

Path alias `@/*` → `src/*`. Use it in all imports instead of relative `../` paths.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint (CI gate; run before pushing)
- `npm run lint:fix` — auto-fix ESLint issues
- `npm run format` — Prettier (print width 120, double quotes, trailingComma all)

No test runner configured yet.

## Coding conventions

TypeScript strict mode via `astro/tsconfigs/strict` (`@tsconfig.json`). Index access returns `T | undefined` — always narrow before use. Tailwind class merging: use `cn()` from `@src/lib/utils.ts`. Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).

## CI and deployment

CI gate: `npx astro sync` → `npm run lint` → `npm run build` (`@.github/workflows/ci.yml`). Warning: the workflow triggers on `master`; the default branch is `main` — PRs to `main` currently bypass CI until the trigger branch is corrected. Deploy target: Cloudflare Pages via `@wrangler.jsonc`. Note: the `name` field in `wrangler.jsonc` still reads `"10x-astro-starter"` — update it to `"asystent-lokatorski"` before the first production deploy.
