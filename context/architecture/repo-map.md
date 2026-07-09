# Repository Map — Asystent Lokatorski

Purpose: orient someone new to this codebase — what lives where, why, and how a request actually flows from tenant tap to downloaded PDF. This is a map of the real repository as it exists today, not an idealized target structure.

## Top-level layout

```
asystent-lokatorski/
├── src/                    # application code (see below)
├── tests/                  # Vitest unit tests (currently: wizard-state.test.ts only)
├── public/                 # static assets served as-is — includes the 12 PDF templates
├── context/                # 10xDevs workflow artifacts (foundation/, changes/, architecture/, domain/)
├── .github/workflows/      # CI: ci.yml (lint → test → build)
├── astro.config.mjs        # output: "server", Cloudflare adapter, React + sitemap integrations
├── wrangler.jsonc          # Cloudflare Workers deploy config (checked in)
├── vitest.config.ts        # test runner config — node environment, @/ alias
├── tsconfig.json           # strict TypeScript config, path alias @/* → src/*
├── AGENTS.md, CLAUDE.md    # AI-agent guidance for this repo (see refactoring-plan.md — partly stale)
├── README.md               # human-facing project README
└── README.md.scaffold      # leftover from bootstrapper conflict resolution — see refactoring-plan.md
```

## `src/` — application code

```
src/
├── data/
│   ├── tree.ts       # THE decision tree — 835 lines, one City ("warszawa"), 5 CaseTypes,
│   │                 # every Stage/SubType/Document node, all copy in 6 languages inline.
│   │                 # This file IS the business logic (see prd.md "Business logic").
│   ├── types.ts      # All shared types: Lang, LocalizedString, DocumentType, Document,
│   │                 # SubType, Stage, CaseType, City, DecisionTree, and the wizard's Step
│   │                 # union (caseType/stage/subType/subStage/result). FR-001 is documented
│   │                 # here as a comment on CaseType.description (line 56).
│   └── ui.ts         # All wizard-chrome strings (buttons, headings, doc-type badge labels)
│                     # in all 6 languages. Separate from tree.ts because this copy is
│                     # UI-shell text, not case-specific content.
├── components/
│   ├── Wizard.tsx    # The one React island. Owns all wizard state (history: Step[], lang),
│   │                 # renders LanguageSwitcher, Tile, DocTypeBadge, and all 5 step views
│   │                 # (caseType/stage/subType/subStage/result). FR-002 (contact-KOPL escape
│   │                 # hatch) lives here as a comment at line 320, rendered unconditionally
│   │                 # below the step content. Also wires the dev-only axe-core a11y checker.
│   ├── Banner.astro  # Unused starter-scaffold leftover — not imported anywhere. See
│   │                 # refactoring-plan.md.
│   └── ui/
│       ├── button.tsx    # shadcn/ui button primitive — not currently used by Wizard.tsx
│       │                 # (Wizard uses raw <button>/<a> with Tailwind classes directly).
│       └── LibBadge.astro # Unused starter-scaffold leftover — not imported anywhere.
├── layouts/
│   └── Layout.astro  # HTML shell: <html lang="pl"> (static default — see note below),
│                      # font preconnect/import (DM Sans via Google Fonts), favicon, <slot />.
├── pages/
│   └── index.astro   # The only route. Wraps <Wizard client:load /> in <Layout>.
├── lib/
│   ├── wizard-state.ts  # Pure, side-effect-free functions extracted from Wizard.tsx:
│   │                    # stepCount, stepNumber, appendStep, popStep, resetSteps,
│   │                    # deriveWizardNodes. This extraction is what made the 29-test
│   │                    # Vitest suite possible — see prd.md "Testing strategy".
│   └── utils.ts         # cn() helper (clsx + tailwind-merge), used throughout Wizard.tsx
│                         # for conditional Tailwind class composition.
├── styles/
│   └── global.css    # Tailwind 4 entry + global styles.
└── env.d.ts           # Astro/Vite ambient type declarations.
```

## `tests/`

```
tests/
└── wizard-state.test.ts   # 29 unit tests over src/lib/wizard-state.ts (confirmed by reading
                            # the file: 6 describe blocks — stepCount, stepNumber, appendStep,
                            # popStep, resetSteps, deriveWizardNodes). No tests exist for
                            # Wizard.tsx itself, tree.ts content integrity, or ui.ts completeness.
```

## `public/`

```
public/
├── documents/warszawa/     # The 12 real KOPL PDF templates, flat directory, Polish-only.
│   ├── sprzeciw-wypowiedzenie.pdf
│   ├── wezwanie-przywrocenie-mediow.pdf
│   ├── nekanie-odciecie-mediow.pdf
│   ├── naruszenie-posiadania.pdf
│   ├── zazalenie-umorzenie.pdf
│   ├── odpowiedz-pozew-eksmisja.pdf
│   ├── pozew-ustalenie-niezasadnosci-podwyzki.pdf
│   ├── wezwanie-uzasadnienie-podwyzki.pdf
│   ├── oswiadczenie-obnizenie-czynszu.pdf
│   ├── wezwanie-obnizenie-czynszu-prywatny.pdf
│   ├── skarga-uchwaly.pdf
│   └── pozew-prawo-do-lokalu-art691.pdf
├── kopl-symbol.png          # KOPL logo, used in Wizard.tsx header and Layout favicon
├── header-right_bw.png      # decorative building illustration, clipped into header
├── favicon.png
└── template.png
```

Each `Document.filename` in `tree.ts` is a literal path under this directory (e.g. `/documents/warszawa/sprzeciw-wypowiedzenie.pdf`), fetched by a plain `<a href download>` — no server-side lookup, no manifest, no build-time validation that a referenced file actually exists on disk.

## `context/` (10xDevs workflow artifacts)

```
context/
├── foundation/
│   ├── tech-stack.md       # bootstrapper output — read-only input to this map, not modified here
│   └── prd.md               # this certification submission's PRD (see prd.md)
├── changes/
│   ├── bootstrap-verification/verification.md   # read-only, bootstrapper's own log
│   └── personalizacja-eligibility/research.md   # read-only, L3 feature-research artifact
├── architecture/
│   ├── repo-map.md          # this file
│   └── refactoring-plan.md
└── domain/
    ├── ubiquitous-language.md
    └── bounded-contexts.md
```

`context/archive/` does not currently exist in this repo. If it is created later, it is understood to be immutable — no skill or future edit should write into it.

## Request flow — how a tap becomes a downloaded PDF

1. **Page load**: Cloudflare Worker serves the SSR-rendered shell from `src/pages/index.astro`; `<Wizard client:load />` hydrates immediately (no lazy hydration — the wizard is the entire page's purpose).
2. **Initial render**: `Wizard.tsx` initializes `history = [{ id: "caseType" }]` and reads `tree` (`src/data/tree.ts`) to find `city = tree.find(c => c.id === "warszawa")` — the city step is skipped entirely; Warsaw is hardcoded (FR-006).
3. **Tenant taps a case-type tile**: `go({ id: "stage", caseTypeId })` calls `appendStep` (`src/lib/wizard-state.ts`), pushing a new `Step` onto the history array (immutably — a new array is returned, the old one is untouched).
4. **Derivation**: on every render, `deriveWizardNodes(step, city)` walks `city.caseTypes → stage.subTypes? → subType.stages? ` to resolve the current `caseType`/`stage`/`subType`/`subStage`/`resultStage` objects purely from the `Step` union member's IDs — this is the "routing" business logic in action, re-run on each render rather than cached.
5. **Tenant continues** through `stage` → (`subType` → `subStage`)? → `result`, each tap calling `go()` again; `back()` calls `popStep`; `reset()` calls `resetSteps()`.
6. **Result step**: `resultStage.documents` (an array of `Document`) is rendered — one card per document, each showing its `DocTypeBadge` (from `DocumentType`), localized `name`/`description`/optional `note`, and a download link built directly from `Document.filename`.
7. **Download**: the anchor's `download` attribute triggers a direct browser fetch of the static PDF from `public/documents/warszawa/` — no server-side processing, no personalization, the file as authored by KOPL.
8. **Language switching** (orthogonal to the above, can happen at any step): `changeLang(l)` sets React state, writes `localStorage["kopl-lang"]`, and updates `document.documentElement.lang` to the BCP-47 equivalent — every string lookup (`t(localizedString, lang)`) re-resolves on the next render.
9. **Escape hatch** (also orthogonal, FR-002): the "Contact KOPL" link at the bottom of every step is a plain external anchor to `https://lokatorzy.info.pl/kontakt/` — it does not touch wizard state at all.

There is no server round-trip anywhere in this flow after the initial page load — everything from step 3 onward is client-side React state and static asset fetches.
