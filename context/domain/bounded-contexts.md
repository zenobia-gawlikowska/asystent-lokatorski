# Bounded Contexts — Asystent Lokatorski

This is a small application, and today it is really only *one* running context (there's a single React island, a single data file, no services, no API boundaries). The value of naming bounded contexts here is not to describe existing module boundaries — there mostly aren't any yet — but to name the natural conceptual seams that already exist in the domain vocabulary and data shapes, so that if the app grows (multi-city, personalization, eligibility), those seams become real module/service boundaries instead of everything continuing to accrete into `tree.ts` and `Wizard.tsx`.

## 1. Routing context (exists today, is the whole app)

**Responsibility**: classify a tenant's situation, expressed as a sequence of tile taps, into exactly one matching legal path through the decision tree.

**Core objects**: `Step` (the navigation state — `caseType`/`stage`/`subType`/`subStage`/`result`), the pure derivation functions in `src/lib/wizard-state.ts` (`deriveWizardNodes`, `appendStep`, `popStep`, `resetSteps`, `stepCount`, `stepNumber`).

**Key property**: stateless and deterministic. Given a `Step` and a `City`, `deriveWizardNodes` always resolves to the same nodes — no randomness, no external calls, no time-dependence. This is exactly why it was extractable into 29 clean unit tests (see `refactoring-plan.md` item 6 and `prd.md`'s Testing strategy).

**Boundary with Document context**: the Routing context's job ends at identifying a `resultStage` — it hands off a `Stage` object (which happens to already contain `Document[]`) rather than a separate document lookup. Today these two contexts are not actually separated in code — `Stage.documents` lives directly in the same `tree.ts` tree that the Routing context walks. They are named separately here because they answer different questions ("which legal situation is this?" vs. "what document/file satisfies that situation?") and could diverge — e.g., if one Stage should eventually offer alternative document formats (existing static PDF vs. a future personalized version), the Routing context wouldn't need to change at all, only the Document context would.

## 2. Document context (exists today, currently fused with Routing)

**Responsibility**: given a resolved situation (a `Stage`), provide the actual legal document artifact(s) — today, always a single static, Polish-language, KOPL-authored PDF per `Document` node.

**Core objects**: `Document` (`documentType`, localized `name`/`description`/`note`, `filename`), the 12 physical PDF files under `public/documents/warszawa/`.

**Key property**: read-only, pre-authored, addressed by a fixed `documentType` taxonomy (`letter`/`court`/`police` — see `ubiquitous-language.md`). No generation, no templating, no per-tenant customization happens here today.

**Why name it separately even though it's fused in code today**: `context/changes/personalizacja-eligibility/research.md`'s Feature 1 research (document personalization via `window.print()` + HTML templates or `jsPDF`, explicitly *not* via modifying the existing static PDFs, since they have no AcroForm fields) is squarely a Document-context concern — it would add a second way to fulfil the same responsibility ("give the tenant a usable document for their `Stage`") without touching how a `Stage` gets resolved in the first place. If/when that work happens, the natural boundary is: Routing context still says "you are here, in `Stage` X"; Document context decides "here is your document for `Stage` X" — either the existing static PDF, or a newly generated personalized one.

## 3. Eligibility context (does not exist yet — researched only)

**Responsibility** (per `context/changes/personalizacja-eligibility/research.md`, Feature 2): determine whether a tenant qualifies for a municipal flat, given their household size and income, against a city's income thresholds.

**Why this is a genuinely different bounded context, not just a new case type**:

- **Different data shape.** The Routing/Document contexts deal in static, pre-authored content (case descriptions, document text) that doesn't change based on tenant input beyond which tile they tap. Eligibility is a *calculation* — `checkEligibility(cityId, monthlyIncomePerPerson, householdSize)` in the research doc takes a numeric input and returns a computed boolean/threshold comparison. This is closer to a small rules-engine than a content tree.
- **Different privacy profile.** Routing and Document contexts handle zero tenant-specific information — every tenant sees the same tree, taps the same tiles, downloads the same static file. Eligibility, by contrast, requires the tenant to disclose actual income and household size — even if this never leaves the browser (the research doc is explicit that the RODO/GDPR boundary is "whatever stays in the browser is safe," and recommends `useState`/`localStorage` only, no server calls), it is qualitatively different personal information than anything the app handles today, and directly interacts with the Access Control Open Question in `prd.md`: an app that starts collecting even browser-local income data is a slightly different privacy posture than one that collects literally nothing.
- **Different data volatility.** The Routing/Document contexts' content changes only when KOPL authors a new document or legal situation. Eligibility's thresholds are pegged to Poland's minimum pension (`multiplierOfMinPension`), which is revalued annually (1 March, by ZUS) — the research doc explicitly recommends a `// last verified: YYYY-MM-DD` comment convention and a recurring manual-review task, because there is no API. This is an operational/maintenance concern the other two contexts don't have.
- **Different legal basis per city.** Thresholds are set by municipal council resolution, city by city (the research doc tabulates different multipliers for Warszawa/Kraków/Wrocław) — this parallels the City-scoping already present in the Routing context's data model (`DecisionTree = City[]`) but is a separate axis: a city's *decision tree* (which legal situations exist, which documents apply) and a city's *eligibility thresholds* (income cutoffs for municipal housing) are indepedent facts about that city that would need independent maintenance.

**Where it would plug in, if built**: the research doc's own recommendation (`src/data/eligibility-criteria.ts`, separate from `tree.ts`; a possible `EligibilityChecker.tsx` component, either as a new Astro page/island or an additional step inside the existing Wizard) is consistent with treating this as its own bounded context rather than folding it into `tree.ts`'s existing `CaseType`/`Stage` shape — the underlying objects (`IncomeThreshold`, `TenancyTier`, `EligibilityCriteria`) don't fit the `CaseType → Stage → Document` shape at all, they're a different kind of thing.

## Summary table

| Context | Status | Core question it answers | Data shape |
|---|---|---|---|
| Routing | Live, is the whole app today | "Which legal situation is this tenant in?" | Tree traversal over static IDs (`Step` + `deriveWizardNodes`) |
| Document | Live, fused with Routing in code | "What document satisfies that situation?" | Static `Document[]` per `Stage`, pointing at pre-authored PDFs |
| Eligibility | Not built — researched only | "Does this tenant qualify for a municipal flat?" | Numeric threshold calculation against annually-revalued reference data, per city |
