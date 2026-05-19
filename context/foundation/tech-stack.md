---
starter_id: 10x-astro-starter
package_manager: npm
project_name: asystent-lokatorski
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: false
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Solo after-hours project building a client-side document-routing wizard for Polish tenant rights. Standard path — 10x-astro-starter is the recommended default for (web-app, js). Astro + React + TypeScript + Tailwind + Cloudflare Pages clears all four agent-friendly quality gates; bootstrapper confidence is first-class. No auth, payments, realtime, AI, or background jobs in MVP scope — the Supabase layer ships dormant and becomes the integration point when the future LLM-assisted eligibility capability lands. i18n is the key feature driver; Astro's content model handles multi-language UI copy cleanly. GitHub Actions with auto-deploy-on-merge is the starter's standard CI shape, wired to Cloudflare Pages for zero-config global edge delivery.
