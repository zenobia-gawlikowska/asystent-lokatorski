# Asystent Lokatorski

A multilingual document routing tool for [Komitet Obrony Praw Lokatorów (KOPL)](https://lokatorzy.info.pl/).

Guides tenants through a step-by-step decision wizard to find and download the correct legal document template for their situation. Built for Warszawa, with the data model ready to support additional cities.

## Features

- **6 languages**: Polish, Ukrainian, Russian, English, Spanish, French
- **Decision wizard**: 3–5 step flow depending on case complexity, with a progress bar
- **Document badges**: icons distinguish letters to landlords, court filings, and police reports
- **12 PDF templates** covering: tenancy termination, eviction, rent increases, utility shutoffs, possession disputes, and more
- **Single-page app** — no login required

## Tech stack

- [Astro 6](https://astro.build/) — SSR, deployed to Cloudflare Workers
- [React 19](https://react.dev/) — interactive wizard island
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (new-york)
- TypeScript throughout

## Development

```bash
cp .env.example .dev.vars   # Cloudflare local dev secrets (not needed for this app)
npm install
npm run dev                 # starts local dev server
```

Other commands:

```bash
npm run build       # production build (SSR via @astrojs/cloudflare)
npm run preview     # preview production build
npm run lint        # ESLint with type-checked rules
npm run lint:fix    # auto-fix lint issues
npm run format      # Prettier
```

Requires Node.js v22 (see `.nvmrc`).

## Project structure

```
src/
  components/
    Wizard.tsx          # main React wizard component
  data/
    tree.ts             # decision tree data (cities → case types → stages → documents)
    types.ts            # TypeScript types
    ui.ts               # localized UI strings (all 6 languages)
  pages/
    index.astro         # single page — mounts <Wizard>
  layouts/
    Layout.astro        # HTML shell, fonts, global styles
public/
  documents/warszawa/   # PDF templates (Polish)
```

## Deployment

```bash
npx wrangler deploy
```

Requires a Cloudflare account with `wrangler` authenticated. CI (GitHub Actions) runs lint + build on every push to `master`.
