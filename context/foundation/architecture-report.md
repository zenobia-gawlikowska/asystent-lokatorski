---
title: Architecture Report — Asystent Lokatorski
tier: 10xArchitect
last_updated: 2026-07-09
---

# Architecture Report — Asystent Lokatorski

## What this app actually is

Asystent Lokatorski is a small, deliberately narrow tool: a stateless, client-heavy Astro+React wizard that walks a Warsaw tenant through 3–5 tile taps and hands them one of 12 real KOPL legal-document PDFs. There is no backend logic beyond serving static assets from a Cloudflare Worker. The entire "system" fits in five source files (`src/data/{tree,types,ui}.ts`, `src/components/Wizard.tsx`, `src/lib/wizard-state.ts`) plus a folder of PDFs. This report is my synthesis across the four supporting artifacts — [repo-map.md](../architecture/repo-map.md) (L2), [refactoring-plan.md](../architecture/refactoring-plan.md) (L4), the domain notes ([ubiquitous-language.md](../domain/ubiquitous-language.md) and [bounded-contexts.md](../domain/bounded-contexts.md), L5), and the pre-existing [personalizacja-eligibility/research.md](../changes/personalizacja-eligibility/research.md) (L3) — plus the PRD I wrote alongside this report ([prd.md](./prd.md)). It's meant to be argued with, not accepted on faith.

## What matters most: the app's simplicity is a feature, and most of the "problems" are trade-offs the team already made on purpose

Reading the git history end to end, this is not an under-engineered app that happened to skip things — it's an over-engineered starter (10x-astro-starter, which ships Supabase auth, shadcn/ui, a full component library) that was **actively stripped down** three times in a row at the very start (commits `2348ec9`, `5e88a57`, `b034eab`, all "remove ... scaffold/packages/unused"). That's a team making a call: this tool's entire value proposition is zero friction for a stressed tenant, and every piece of scaffolding that doesn't serve that goal was cut. The repo map bears this out — there's no service layer, no API routes, no database, because none of that would make the wizard better at its one job.

I think this is the right call, and I'd resist "fixing" it by adding structure the app doesn't need yet. The `tree.ts` monolith (835 lines, flagged in the refactoring plan) is the one place I'd watch, not touch — it's unwieldy but not yet broken, and the honest answer is that splitting it now, before a second city is actually scoped, is more likely to guess wrong about the right seam than to help. The refactoring plan marks it "can wait" for that reason.

## What's actually broken, and what I'd fix first

The refactoring plan's two "do first" items are both **documentation drift**, not code defects, and I want to be blunt about why that ranks above the code smells: `CLAUDE.md` currently tells any AI agent or new contributor that this app has Supabase auth, a `dashboard.astro`, and `PROTECTED_ROUTES` middleware — none of which exist. `AGENTS.md`, sitting right next to it, correctly says auth was deliberately removed. Two root-level AI-context files in the same repo contradicting each other on the single most consequential architectural fact (does this app have auth?) is a landmine for exactly the kind of automated or semi-automated work this course is about — an agent reading only `CLAUDE.md` would confidently scaffold against auth infrastructure that doesn't exist. `README.md.scaffold`, a leftover starter README with the same stale Supabase claim, compounds it. Both are cheap to fix (delete or rewrite) and I'd do them before anything else, specifically because they're the artifacts most likely to mislead the next person (or agent) who touches this repo — including whoever reviews this certification.

Below that, in priority order: add a data-integrity test that every `Document.filename` in `tree.ts` resolves to a real file under `public/documents/warszawa/`, and that every `LocalizedString` has all 6 languages populated. The 29 existing Vitest tests are genuinely good — they cover the pure navigation logic thoroughly — but they cover zero percent of the actual content data, which is the part most likely to break in a way a real tenant discovers (a typo'd filename fails silently until someone clicks download). This is a higher-leverage next test than component-level testing of `Wizard.tsx`, because the component logic is thin and already delegates its interesting behavior to the tested `wizard-state.ts`.

## What I'd deliberately leave alone

The dead starter-scaffold components (`Banner.astro`, `LibBadge.astro`) and the `zaniedbanie-napraw`/`dzika-eksmisja` content duplication are real, but low-stakes — I've named them in the refactoring plan for completeness, not because they need attention this quarter. I'd also explicitly *not* build either of the two researched-but-unbuilt features (personalization, eligibility-checking) right now. The research doc is unambiguous that both are more complex than they look (no AcroForm fields to fill, no eligibility API, Cloudflare's WASM restrictions ruling out the "obvious" library choices), and neither is blocking the app's current job. They're correctly parked as Non-Goals in the PRD.

## The uncomfortable part: two mandatory certification requirements don't fit this app, and I'm not going to pretend otherwise

This is the part of the synthesis I want to be most direct about, because it's the part most tempting to paper over. The certification's Builder checklist requires (a) an access-control mechanism and (b) CRUD over a user-editable domain entity. This app has neither, and — this is the important part — **not by oversight**. No PII collection and no login are the product's actual design, arrived at deliberately (auth scaffolding removed three commits in a row, at the very start of the project, before any feature work). The domain notes make the same point from a different angle: the only "data model" that exists is a read-only content-routing tree (`City → CaseType → Stage → Document`), authored entirely by KOPL ahead of time, identical for every visitor — there is no entity a tenant creates, edits, or deletes.

I don't think the honest move here is to bolt on a login screen or a fake CRUD feature just to check a box — that would actively work against the thing that makes this tool useful (a tenant in crisis getting a document in under a minute, with nothing to sign up for). I've written both gaps into `prd.md`'s Open Questions verbatim, with the real question being whether the certification can grant an exception for an app type that is intentionally public and stateless, or whether a real mechanism has to be added even at the cost of the product's own design goals. If a mechanism does need to be added, my instinct — not committed to code here — is that the eligibility-checker research already points at the shape of a legitimate CRUD entity (a saved eligibility profile/result, which is genuinely user-specific data a tenant might want to revisit) rather than inventing an unrelated feature just to satisfy the rubric. That's speculative and belongs in Open Questions, not in this app today.

## What I'd do next, in order

1. Fix the `CLAUDE.md`/`AGENTS.md`/`README.md.scaffold` drift (cheap, prevents future misdirection).
2. Add the `tree.ts` data-integrity test (cheap, protects the actual tenant-facing outcome).
3. Get a human decision on the two Open Questions above — access control and CRUD — since neither should be resolved by an agent inventing a feature to satisfy a checklist.
4. Only after that: revisit whether `tree.ts` needs splitting, and only once a second city is actually being scoped, not speculatively.

## Consolidated Open Questions (see source files for full context)

1. **Access control** vs. the mandatory Builder checklist — no mechanism exists, by deliberate design; is an exception grantable or must one be added regardless. (`prd.md`)
2. **CRUD** vs. the mandatory Builder checklist — no persisted user-editable entity exists; could a future eligibility-checker's saved profile close this, or is a different surface expected. (`prd.md`)
3. The five open questions already logged in `context/changes/personalizacja-eligibility/research.md` — personalization vs. existing-PDF coexistence, city count for eligibility MVP, translation scope for eligibility criteria, who owns the annual minimum-pension update, and whether eligibility is a new page or a Wizard step. (referenced, not duplicated)
