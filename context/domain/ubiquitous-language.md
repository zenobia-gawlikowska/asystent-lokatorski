# Ubiquitous Language — Asystent Lokatorski

Domain vocabulary grounded directly in `src/data/tree.ts` (case-type and stage IDs/labels) and `src/data/types.ts` (structural types). Every term below is either a literal identifier in the code or a direct translation of one — nothing here is invented.

## Case types (`CaseType.id` in `src/data/tree.ts`)

| id | Polish legal meaning | English gloss |
|---|---|---|
| `wypowiedzenie` | Wypowiedzenie umowy najmu — the landlord's formal notice terminating the tenancy. Covers the tenant's response window and, if the tenant stays past the notice period without leaving, the two paths that follow: the landlord either pursues eviction through the courts (`pozew-o-eksmisje`) or resorts to unlawful self-help pressure tactics (the `dzika-eksmisja-sub` subtree). | Termination of tenancy (includes the eviction-lawsuit and illegal-eviction subtrees reachable from it) |
| `podwyzka-czynszu` | Podwyżka czynszu — a rent increase, either properly noticed in writing or demanded without the written justification Polish law requires. | Rent increase |
| `zaniedbanie-napraw` | Zaniedbanie napraw — the landlord/manager's failure to repair defects that reduce the flat's usability, giving the tenant grounds to reduce rent. In the current tree this case type is narrowed specifically to the *rent-reduction* angle of repair neglect (`obnizka-czynszu` stage), split by whether the flat is municipal (`lokal-komunalny`) or privately rented (`lokal-prywatny`) — the legal basis and document differ (a unilateral statement for municipal tenants vs. a formal demand citing Art. 664 §1 KC for private tenants). | Repair neglect (rent-reduction angle only; narrowed to municipal + private tenancy paths) |
| `dzika-eksmisja` | Dzika eksmisja — literally "wild eviction": a landlord bypassing the courts and using unlawful pressure directly (cutting utilities, entering the flat without consent, or general harassment) to force a tenant out. Consolidated with what used to be a separate `odciecie-mediow` (utility shutoff) case type — commit `4c49cd0` folded utility cutoff into this one as a stage rather than keeping it as its own top-level case type. | Illegal / "wild" eviction (self-help eviction outside the courts; subsumes utility shutoff) |
| `odmowa-lokalu` | Odmowa przyznania lokalu przez Miasto — the City's refusal to grant, restore, or transfer a municipal flat, including after the death of the previous tenant (succession to tenancy) or via a City Council housing resolution the tenant wants to challenge. | City's refusal to grant a municipal flat |

## Stage/sub-type vocabulary worth naming explicitly

- **Sprzeciw** (objection) — a formal written challenge that pauses or blocks a landlord's action (used against both `wypowiedzenie` and `podwyzka-czynszu`). Filing a `sprzeciw` has a real legal effect: for a termination notice, it forces the landlord into court; for a rent increase, it freezes the rent at the pre-increase level until a court rules.
- **Wezwanie** (demand/summons letter) — a formal written demand short of litigation, used to compel a specific action (restoring utilities, providing written justification for a rent increase, reducing rent). Several `wezwanie` documents explicitly note that they create a paper trail required for a later criminal or civil case, even though the letter itself isn't filed with a court.
- **Pozew** (lawsuit / statement of claim) — a document filed with a court, used both offensively (e.g., `pozew-art691`, claiming succession rights to a flat) and defensively (`odpowiedz-pozew-eksmisja`, responding to a landlord's eviction suit).
- **Zażalenie** (interlocutory appeal/complaint) — used specifically against a Police decision to discontinue (`umorzyć`) a criminal proceeding; escalates the matter to a prosecutor or court for review.
- **Zawiadomienie** (notification, in the criminal sense: a report to law enforcement) — distinct from `wezwanie`; this is filed with the Police/Prosecutor, not with the landlord.
- **Skarga** (complaint, in the administrative sense) — filed with an administrative court against a City Council resolution (`skarga-uchwaly`), as distinct from a `zażalenie` (which targets a Police/prosecutorial decision) or a `pozew` (a civil claim).
- **Dzika eksmisja** — see case types table above; the term recurs at the sub-type level too (`dzika-eksmisja-sub`), where it names the branch of the `wypowiedzenie` tree that leads a tenant who stayed past their notice period into the self-help-eviction subtree, rather than the formal court-eviction path (`pozew-o-eksmisje`).
- **Lokal komunalny vs. lokal prywatny** — the recurring municipal-vs-private-landlord distinction that changes both legal basis and document. Appears explicitly as a fork under `zaniedbanie-napraw` (`lokal-komunalny` / `lokal-prywatny` sub-types) and implicitly in `odmowa-lokalu` (which only makes sense for municipal flats).

## `DocumentType` (`src/data/types.ts`, drives the result-card badge)

| value | Polish domain meaning | Who receives it |
|---|---|---|
| `letter` | Pismo do właściciela / zarządcy | The landlord or building manager |
| `court` | Wniosek / pozew / skarga do sądu | A court (district court for civil/possession matters, administrative court for `skarga-uchwaly`) |
| `police` | Doniesienie / zawiadomienie do organów ścigania | Police or the prosecutor's office |

This taxonomy is not about document *format* — it's about the document's **addressee/venue**, which is the piece of information the tenant most needs to orient themselves before downloading (am I sending this to my landlord, or filing it somewhere official?).

## Structural hierarchy (`src/data/types.ts`)

```
City → CaseType → Stage → (SubType → Stage)? → Document
```

- **City** — currently only `warszawa`. A proper noun, displayed as-is (not localized) in all 6 UI languages.
- **CaseType** — the top-level situation a tenant self-identifies with (the 5 rows in the table above). Carries both a short tile `label` and a longer `description` that helps the tenant recognize their situation (this description field is FR-001 — see `prd.md`).
- **Stage** — "what point are you at" within a case type. A `Stage` is a leaf (has `documents`) or a branch point (has `subTypes` for one more level of navigation) — never both, per the type's own comment in `types.ts`.
- **SubType** — an intermediate classification used only when a `Stage` needs a further fork before reaching a terminal stage (e.g., `lokal-komunalny` vs. `lokal-prywatny` under `zaniedbanie-napraw`; `dzika-eksmisja-sub` vs. `pozew-o-eksmisje` under `wypowiedzenie`'s `termin-minal` stage). Not every case type has one — most resolve in 3 steps (`caseType → stage → result`); only the tree paths that pass through a `SubType` extend to 5 steps.
- **Document** — the terminal node: a real KOPL PDF plus its `documentType` badge, localized `name`/`description`, and optional `note` (procedural guidance like a filing deadline or "also report to Police").

## Terms deliberately NOT part of this domain (yet)

Per `context/changes/personalizacja-eligibility/research.md` (read-only input, not restated here in full — see that file and the Non-goals section of `prd.md`):

- **Eligibility / uprawnienie** — the researched-but-unbuilt concept of a tenant qualifying for a municipal flat based on income thresholds expressed as a multiplier of Poland's minimum pension (`multiplierOfMinPension`). This is a genuinely different kind of domain object from anything in `tree.ts` today — a numeric threshold calculation, not a content-routing decision — and does not yet exist in code.
- **Personalizacja** — the researched-but-unbuilt concept of generating a document pre-filled with a specific tenant's name/address/dates, as distinct from downloading KOPL's static, generic template as-is. Not implemented; existing PDFs have no AcroForm fields to fill.
