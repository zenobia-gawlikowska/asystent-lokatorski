---
product_type: web-app
tech_preferences:
  language_family: js
status: draft
last_updated: 2026-07-09
source: reverse-engineered from implemented code (no prior shape-notes.md existed)
---

# PRD — Asystent Lokatorski

> This PRD was written retroactively against the already-implemented MVP, for certification submission purposes. It is not a forward-looking spec written before code existed — it documents what was built, cites where each requirement is anchored in code, and routes every real gap into Open Questions rather than inventing a resolution. Wherever the underlying facts were undecided or missing, that is stated explicitly rather than filled in.

## Vision

Asystent Lokatorski (Tenant's Assistant) helps a tenant in Warsaw who is facing a landlord or municipal-housing problem find the one correct, pre-written Polish legal document for their situation — in under a minute, in their own language, with no login and no data collection. It exists because KOPL's constituents often don't know which of dozens of possible legal steps applies to them; the wizard's only job is to compress that triage into 3–5 tile taps.

## Persona

**The tenant seeking help** — a renter or municipal-flat occupant in Warsaw who has just received a hostile letter, is facing rent pressure, has had utilities cut off, or has been refused a municipal flat. Likely non-technical (walk-up usage on a phone, not a desktop workflow). Plausibly not a native Polish speaker: the app ships 6 UI languages (pl/ua/ru/en/es/fr — `src/data/ui.ts`), which strongly signals the intended audience includes Ukrainian- and Russian-speaking tenants in particular, alongside Polish speakers and a smaller Spanish/French-speaking population. The persona is stressed, time-pressured, and needs to self-identify their situation from short descriptions rather than legal terminology — this is why every case-type tile carries a plain-language `description` (FR-001) rather than just a legal label.

A secondary, implicit persona is the **KOPL staff member** who is the destination of the escape hatch (FR-002) when the wizard's coverage doesn't match the tenant's actual situation.

## Success criteria

- A tenant can go from landing on the page to holding a relevant PDF in 3–5 taps, with no form fields, no account creation, and no page reload (client-side wizard state).
- The tenant can complete the flow in their own language end-to-end, including the downloaded document's *surrounding UI* (the document itself is always Polish — this is a stated, deliberate constraint, not an oversight: see `LocalizedString` comment in `src/data/types.ts` line 15, "Documents themselves are always in Polish").
- A tenant whose situation doesn't fit any of the 5 modeled case types always has a visible way to reach a human (FR-002), rather than hitting a dead end.
- The CI pipeline (lint → test → build) passes on every change before merge, so a broken build or regressed wizard-state logic cannot reach production silently.

## User stories

Given/When/Then, covering the actual implemented flows only.

**US-01 — Selecting a case type**
- Given a tenant has just opened the app (initial `history = [{ id: "caseType" }]` in `src/components/Wizard.tsx`),
- When they read the 5 case-type tiles, each showing a short label and a longer situational description (FR-001),
- Then they tap the tile matching their situation and advance to the `stage` step.

**US-02 — Standard 3-step path to a document**
- Given a tenant has selected a case type whose stage has no further branching (`stage.subTypes` is empty, e.g. `podwyzka-czynszu` → `zawiadomienie-o-podwyzce`),
- When they tap a stage tile,
- Then they land directly on the `result` step and see the matching document(s) with type badge, description, optional legal note, and a download link — a 3-step path (`stepCount` returns 3 in `src/lib/wizard-state.ts`).

**US-03 — Extended 5-step path through a sub-type**
- Given a tenant has selected a case type whose stage branches further by sub-type (e.g. `wypowiedzenie` → `termin-minal`, which branches into `dzika-eksmisja-sub` and `pozew-o-eksmisje`),
- When they tap the stage tile, then a sub-type tile, then a sub-stage tile,
- Then they reach the `result` step via a 5-step path (`stepCount` returns 5 when `step.id === "subType" | "subStage"` or `result` with a `subTypeId`).

**US-04 — Going back**
- Given a tenant is anywhere past the first screen (`history.length > 1`),
- When they tap the "← Wstecz / Back" button (rendered top-of-content, right-aligned per commit `a921d39`),
- Then the last step is popped off the history stack (`popStep` in `wizard-state.ts`) and they see the previous screen, with the guard that a single-entry history is never popped below `caseType`.

**US-05 — Starting over**
- Given a tenant has reached the `result` step,
- When they tap "Zacznij od nowa / Start over",
- Then `resetSteps()` returns a fresh `[{ id: "caseType" }]` history and they restart the wizard from the first screen.

**US-06 — Switching language**
- Given a tenant wants the UI in a language other than the default Polish,
- When they tap one of the 6 language buttons in the header (`LanguageSwitcher` in `Wizard.tsx`),
- Then all UI strings re-render in that language immediately, the choice is persisted to `localStorage` under key `"kopl-lang"`, and `document.documentElement.lang` is updated to the corresponding BCP-47 code (`LANG_TO_BCP47` maps internal `"ua"` to standard `"uk"`).
- And on a later visit, the saved language is read back from `localStorage` in a `useEffect` (to avoid SSR/hydration mismatch) and applied automatically.

**US-07 — Contacting KOPL staff directly**
- Given a tenant at any point in the wizard — regardless of step —
- When they see the "Porozmawiaj z KOPL / Contact KOPL" link, always rendered below the main content (FR-002, `Wizard.tsx` line 320),
- Then they can open KOPL's contact page (`https://lokatorzy.info.pl/kontakt/`) in a new tab, without needing to complete or abandon the wizard flow first.

**US-08 — Downloading the matched document**
- Given a tenant has reached the `result` step and sees one or more matched documents,
- When they tap "Pobierz dokument / Download document",
- Then the browser downloads the static Polish-language PDF at the document's `filename` path under `public/documents/warszawa/` via a plain `<a href download>` — no generation, no personalization, the file as-authored by KOPL.

## Functional Requirements

FR-001 and FR-002 already exist as inline code comments; cited verbatim from their real locations. Numbering continues from FR-003 for newly identified implemented behavior — no existing FR is renumbered.

- **FR-001** — *Case-type description helps tenant recognize their situation.* Source: `src/data/types.ts` line 56, comment on `CaseType.description`: `// Longer description that helps the tenant recognize their situation (FR-001)`.
- **FR-002** — *Always-visible "contact KOPL staff" escape hatch.* Source: `src/components/Wizard.tsx` line 320, comment: `{/* Contact staff escape — FR-002, always visible */}`. Renders on every step, not just a dead-end state.
- **FR-003** — *Wizard navigation is a back/forward history stack, not a single current-step pointer.* The wizard tracks a `Step[]` history (`src/components/Wizard.tsx`, `useState<Step[]>([{ id: "caseType" }])`); `appendStep` pushes, `popStep` pops with a guard against popping the last remaining entry, `resetSteps` returns a fresh single-entry array. Source: `src/lib/wizard-state.ts`.
- **FR-004** — *Documents are badged by addressee/venue type.* Every `Document` carries a `documentType` of `"letter" | "court" | "police"` (`src/data/types.ts` lines 19–22), rendered as a colored icon badge (`DocTypeBadge` in `Wizard.tsx`, using `lucide-react` icons `FileText`/`Scale`/`ShieldAlert`) so a tenant can tell at a glance whether a document goes to their landlord, a court, or the police, before downloading it.
- **FR-005** — *Full UI is available in 6 languages, switchable at runtime.* `LANGS = ["pl", "ua", "ru", "en", "es", "fr"]` (`src/data/types.ts`, `src/data/ui.ts`); every UI-visible string is typed as `LocalizedString` (`Record<Lang, string>`), enforced by the type system, not by convention alone. Choice persists across sessions via `localStorage["kopl-lang"]`.
- **FR-006** — *City is hardcoded to Warsaw; the data model supports more but only one is seeded.* `CITY_ID = "warszawa"` is a constant in `src/components/Wizard.tsx` (line 39); the former city-selection step was deliberately removed (commit `e7c7c40`, "remove city-selection step"). `src/data/types.ts`'s `DecisionTree = City[]` type and `src/data/tree.ts`'s top-level array both remain multi-city-shaped, but only one `City` object (`warszawa`) is populated.
- **FR-007** — *Accessibility hardening: touch targets, focus rings, ARIA, dynamic `lang` attribute, and a dev-time automated a11y checker.* Interactive elements use `min-h-[44px]`/`min-w-[44px]` touch targets and 4px focus-visible rings throughout `Wizard.tsx` (commits `afb3bd9`, `0def309`). The progress bar is a proper `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-label` (commit `4c618c2`). `document.documentElement.lang` is updated dynamically on language change to match the active language's BCP-47 code. In development builds only, `@axe-core/react` is dynamically imported and run against the live DOM (`Wizard.tsx` lines 138–144, tree-shaken out of production via `import.meta.env.DEV`) — commit `8dd74ab`.
- **FR-008** — *Result step supports an optional cautionary/procedural note per document, distinct from its description.* `Document.note` (`src/data/types.ts` line 34) renders in a visually distinct amber callout box on the result card (e.g., filing deadlines, "also report to police" guidance) — separate from the plain-language `description`.

## Non-Functional Requirements

- **Accessibility (NFR-A11Y-01)**: WCAG-oriented hardening is real and verifiable in the commit history, not aspirational — see FR-007 above (touch targets ≥44px, 4px focus rings, ARIA roles/labels, dynamic `html[lang]`, `@axe-core/react` dev-time auditing per commit `8dd74ab`). No automated accessibility test runs in CI today (`.github/workflows/ci.yml` runs lint → test → build only) — axe-core is a dev-console warning tool, not a CI gate.
- **Performance (NFR-PERF-01)**: The app is architecturally static-content-first — Astro's `output: "server"` mode is used (per `astro.config.mjs` and confirmed in `AGENTS.md`) specifically because Cloudflare's Worker adapter (`@astrojs/cloudflare`) requires SSR output, not because the app has dynamic per-request content; there is no database, no API route, no per-user server state. The only client-side interactivity is the single `<Wizard client:load />` React island (`src/pages/index.astro`). Practically, the app behaves like a static site served from Cloudflare's edge, with one hydrated island.
- **Privacy (NFR-PRIV-01)**: **No PII is collected, stored, or transmitted anywhere in the app.** This is a load-bearing design choice, not an accidental gap: the only piece of client state that outlives a session is the language preference in `localStorage["kopl-lang"]` — a UI setting, not personal data. There is no form input anywhere in the wizard; the tenant only taps pre-written tiles. This constraint is why the Supabase auth scaffolding was removed (commits `2348ec9`, `5e88a57`, `b034eab`) and is directly relevant to the Access Control discussion below.

## Business logic

**One-sentence rule**: the case-routing decision tree *is* the business logic — a rule-based classifier that maps a tenant's sequence of tile answers (case type → stage → optional sub-type → optional sub-stage) deterministically to one or more matching legal document(s), with no scoring, ranking, or ambiguity — each path through the tree resolves to exactly one `resultStage`.

This is implemented as pure, side-effect-free tree traversal: `deriveWizardNodes(step, city)` in `src/lib/wizard-state.ts` walks the current `Step` against the `City` object and returns the matching `caseType`/`stage`/`subType`/`subStage`/`resultStage` nodes, or `undefined` at any level where the ID doesn't resolve. The classifier has no weighting or fuzzy matching — it is exact-match tree descent, which is why the decision tree's authoring (getting the right questions and branches into `tree.ts`) is the actual domain expertise being encoded, not the code.

## Data model

There is effectively **no persisted user data model** in this application — no user accounts, no database, no server-side storage. The only thing resembling a "data model" is the content/routing tree itself:

```
City → CaseType → Stage → (SubType → Stage[])? → Document[]
```

(`src/data/types.ts`, seeded in `src/data/tree.ts`, 835 lines, one `City` object: `warszawa`, with 5 `CaseType`s: `wypowiedzenie`, `podwyzka-czynszu`, `zaniedbanie-napraw`, `dzika-eksmisja`, `odmowa-lokalu`.)

This must be described plainly as a **content/routing tree, not a user-data model**: it holds no tenant-specific information, is authored entirely by KOPL/the maintainer ahead of time, and is identical for every visitor. The only piece of state that is created at runtime and outlives a page load is the `Step[]` wizard-navigation history (kept in React `useState`, never persisted) and the `lang` preference string in `localStorage`. Neither is a domain entity a user creates, edits, or deletes — see Access Control and the CRUD Open Question below.

## Access control

**None exists today, by design.** There is no login, no session, no role, no protected route. This is confirmed by:
- Git history: Supabase auth scaffolding was explicitly removed in commits `2348ec9` ("chore: remove auth scaffolding for Asystent Lokatorski MVP"), `5e88a57` ("chore: remove supabase scaffold folder"), and `b034eab` ("chore: remove unused Supabase packages").
- `AGENTS.md`'s own "Hard rules" section states: "No authentication or server-side user state. All Supabase auth scaffolding was deliberately removed — the app collects no PII."

The rationale is coherent with the product's actual purpose: a public triage tool for tenants in crisis should have zero friction and zero data retention. Adding a login screen would work against the product's own privacy design (NFR-PRIV-01) and against the target persona (a stressed tenant who wants a document in the next 60 seconds, not an account).

**This is flagged as an open, unresolved conflict** with the certification's mandatory Builder checklist requirement for "a mechanism kontroli dostępu odpowiedni dla typu aplikacji (np. ekran logowania)" (an access-control mechanism appropriate to the app type). No login flow has been invented here to paper over this gap — see Open Questions.

## Testing strategy

Real, currently-passing test suite: **29 unit tests** (confirmed by reading `tests/wizard-state.test.ts`) over the pure functions extracted to `src/lib/wizard-state.ts` — `stepCount`, `stepNumber`, `appendStep`, `popStep`, `resetSteps`, and `deriveWizardNodes`. Framework: Vitest 4 (`vitest.config.ts`, `environment: "node"`, `include: ["tests/**/*.test.ts"]`). Tests cover: step-count/step-number for every `Step` variant (standard 3-step vs. extended 5-step paths), history-stack immutability (append/pop never mutate the input array, always return a new reference), the single-entry-history pop guard, and full tree-derivation correctness across `caseType` → `stage` → `subType` → `subStage` → `result`, including the case where `city` itself is `undefined`.

Coverage gap, stated plainly: there is no test coverage of `src/components/Wizard.tsx` itself (the React rendering layer, language persistence/BCP-47 mapping, or the axe-core dev integration), and no test coverage of `src/data/tree.ts`'s actual content (e.g., no automated check that every `Stage`/`SubType` node terminates in at least one `Document`, or that every referenced `filename` exists under `public/documents/warszawa/`). The extraction of wizard-state.ts into pure functions specifically enabled the 29 unit tests that exist — the UI layer remains untested.

## Deployment & CI/CD strategy

- **Runtime**: Cloudflare Workers, not Cloudflare Pages. `@astrojs/cloudflare` v13+ generates Worker output (confirmed in `AGENTS.md`: "generates Worker output (`dist/server/entry.mjs`), not the `_worker.js` format used by Pages"); `astro.config.mjs` sets `output: "server"` with the `cloudflare()` adapter. Deploy is via `wrangler deploy`, which reads `dist/server/wrangler.json` (generated at build time).
- **CI gate**: `.github/workflows/ci.yml` — on every push/PR to `main`: checkout → Node 22 setup → `npm ci` → `npx astro sync` → `npm run lint` → `npm test` → `npm run build`. All four steps (sync, lint, test, build) must pass; there is no deploy step in the workflow itself — deployment is described in `AGENTS.md` as auto-triggered "via GitHub integration in the Cloudflare dashboard" on merges to `main`, i.e., outside this repo's CI file.
- **No AI code-review step** exists in CI (confirmed: `ci.yml` has exactly 4 run steps, none invoking an LLM-based reviewer).
- Note: `context/foundation/tech-stack.md` and `context/changes/bootstrap-verification/verification.md` (both bootstrapper-generated, treated as read-only here) record `deployment_target: cloudflare-pages` as the original hint — this was superseded once the team learned Worker output was required for SSR (see `AGENTS.md`'s explicit correction, and commit `a822a8e`, "docs(agents): correct deployment target to Cloudflare Worker"). This PRD reflects the corrected, actually-deployed target.

## Non-goals

- **Multi-city expansion.** The data model (`DecisionTree = City[]`) supports additional cities structurally, but only Warsaw (`warszawa`) is seeded. No second city has been built.
- **LLM-based document personalization.** Researched in `context/changes/personalizacja-eligibility/research.md` (Feature 1). Conclusion there: no existing PDF has AcroForm fields, so "personalization" would mean generating new documents (via `window.print()` + styled HTML, or `jsPDF`), not filling in the existing KOPL templates; an in-browser LLM was evaluated and rejected for MVP as over-engineered (multi-GB client-side models, 2–5 minute load times). Explicitly deprioritized, not built.
- **Municipal-flat income-eligibility checker.** Also researched in the same file (Feature 2): income thresholds expressed as multipliers of Poland's minimum pension, varying by city and household size, with no available API — would require a new `eligibility-criteria.ts` data file and a manual quarterly-review process to stay current. Researched, not built.

## Open Questions

These require human review before certification submission. None has been resolved by inventing an answer.

1. **Access control vs. the mandatory Builder checklist.** The app has no login screen or any access-control mechanism by design (no PII is collected; Supabase auth scaffolding was deliberately removed — see Access Control section above). The certification's Builder checklist requires "a mechanism kontroli dostępu odpowiedni dla typu aplikacji (np. ekran logowania)." Is an exception grantable for an app type that is intentionally public and stateless, or does a real access-control mechanism need to be added even though it would work against the product's own privacy design? This is unresolved.

2. **CRUD vs. the mandatory Builder checklist.** The app has no persisted, user-editable domain entity — it is read-only and stateless (see Data model section above; the `localStorage` language flag is a UI preference, not a CRUD entity). Could the researched-but-unbuilt eligibility-checker (Feature 2 in `context/changes/personalizacja-eligibility/research.md`), if built with saved eligibility profiles/results, close this gap? Or is a different, smaller CRUD surface expected? This is unresolved.

3. **The five open questions already logged in `context/changes/personalizacja-eligibility/research.md`** (its own "Open Questions" section) are not duplicated here — refer to that file directly. In summary, they cover: whether personalized documents should coexist with or replace the existing PDF downloads; how many cities the eligibility checker should support at MVP; whether eligibility criteria need translation into all 6 UI languages or can stay Polish-only (numeric calculator is language-agnostic); who owns the annual update of the minimum-pension reference figure; and whether the eligibility checker should be a new page or an additional step inside the existing Wizard.
