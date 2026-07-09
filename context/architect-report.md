---
title: Raport architektoniczny — Moduł 4 (10xArchitect)
created: 2026-07-09
type: certification-report
---

# Raport architektoniczny — Moduł 4 (10xArchitect)

Repozytorium bazowe: **asystent-lokatorski** (jedyne repo użyte w tym module — potwierdzone poniżej per-artefakt).

## 1. Opisane projekty

| Artefakt | Repo | Stack | Skala (orientacyjnie) |
|---|---|---|---|
| L2 — `context/architecture/repo-map.md` | asystent-lokatorski | Astro 6 (SSR, output: "server") + React 19 island, Tailwind 4, Cloudflare Workers (`@astrojs/cloudflare`), Vitest | 1 route, 1 React island (`Wizard.tsx`, 335 linii), `tree.ts` 835 linii, 12 plików PDF, 29 testów jednostkowych |
| L3 — `context/changes/personalizacja-eligibility/research.md` | asystent-lokatorski (frontmatter: `repository: 10x-cli / asystent-lokatorski`, `branch: poc-kopl`) | Ten sam stack; research nad `jsPDF`/`window.print()`/Cloudflare Workers AI jako opcjami dla nie-zbudowanej funkcji | Dokument badawczy, nie kod — 2 planowane featury, 0 linii produkcyjnych |
| L4 — `context/architecture/refactoring-plan.md` | asystent-lokatorski | Ten sam stack | 6 pozycji do refaktoryzacji (2 "do first", 4 "can wait") |
| L5 — `context/domain/01-03` (distillation, invariant/aggregate, ACL) | asystent-lokatorski | Ten sam stack | 7 kandydatów-na-inwariant, 1 wybrany agregat (`DecisionTreeCatalog`), 1 wybrany ACL (`DocumentDelivery`) |

Wszystkie cztery artefakty pochodzą z **jednego** repozytorium — nie ma tu wielo-projektowego zestawu do porównania. L3 ma niezgodne pole `repository` we frontmatterze (`10x-cli`) obok poprawnego `asystent-lokatorski` w treści — potraktowane jako to samo repo na podstawie treści dokumentu (cytuje `src/components/Wizard.tsx`, `src/data/tree.ts` z tego repo).

## 2. Mapa projektu (z L2)

1. **Cała logika domenowa mieści się w jednym pliku danych** — `src/data/tree.ts` (835 linii, wszystkie 6 języków inline) jest zarówno drzewem decyzyjnym, jak i treścią merytoryczną produktu; nie ma warstwy serwerowej obsługującej domenę.
2. **Jeden entry point, jeden komponent** — `src/pages/index.astro` → `<Wizard client:load />` to cała aplikacja; `Wizard.tsx` jest jedynym React island i właścicielem całego stanu (`history: Step[]`, `lang`).
3. **Strefa ryzyka wskazana explicite**: `Document.filename` w `tree.ts` to literalna ścieżka, pobierana przez plain `<a href download>` — "no server-side lookup, no manifest, no build-time validation that a referenced file actually exists on disk" (repo-map.md:100).
4. **Martwy kod skrzynkowy**: `Banner.astro`, `LibBadge.astro`, `README.md.scaffold` — pozostałości scaffoldu, niezaimportowane, niedotknięte.
5. **Najważniejszy unknown**: brak w mapie jakiejkolwiek wzmianki o rejestrze kontraktów (`docs/reference/contract-surfaces.md` z tego projektu 10xDevs) — **BRAK artefaktu** w `asystent-lokatorski`; L4 to potwierdza niezależnie.

## 3. Analiza ficzera (z L3)

**Co i dlaczego zbadano**: L3 nie jest studium już-działającego ryzykownego przepływu — to research dwóch **jeszcze nie zbudowanych** funkcji: personalizacji dokumentów przez LLM i sprawdzania eligibility do lokalu komunalnego. Wybór tego tematu wiąże się z tą samą strefą ryzyka, którą L2 nazwał wprost (pkt 3 wyżej) i którą L5/ACL (`03-anti-corruption-layer.md`) rozpoznał jako realne sprzężenie architektoniczne: kształt "dokument = statyczny plik PDF bez pól AcroForm" zakodowany w `Document.filename: string`.

**Feature overview (3-4 zdania)**: Input dla obu featurów miałby pochodzić wyłącznie z przeglądarki tenanta (dane osobowe, dochód) — nigdy z serwera, bo aplikacja jest w 100% client-side i RODO wymaga, by dane nie opuszczały urządzenia. Stan zmieniałby się lokalnie (`useState`/`localStorage`), nigdy w bazie, bo takiej nie ma. Na wyjściu Feature 1 miałby zwrócić nowo wygenerowany dokument (HTML-do-druku lub `jsPDF`), a nie wypełniony istniejący PDF — bo żaden z 12 plików KOPL nie ma pól AcroForm. Feature 2 zwróciłby wynik kalkulacji (`eligible: boolean`, próg w PLN) na podstawie statycznych danych progowych (mnożnik najniższej emerytury), bez żadnego zewnętrznego API.

**Technical debt — 2-3 najważniejsze ryzyka**:
1. **Brak granicy dostawy dokumentu (potwierdzone przez grep, nie ast-grep)**: `grep -rn "\.filename" src/` (cytowane w `03-anti-corruption-layer.md`, KROK 6) zwraca dokładnie jedno wystąpienie konsumpcji poza definicją typu/danych — `Wizard.tsx:302`, `href={doc.filename}`. Nie istnieje żaden adapter między "co dostarczyć" (treść z `tree.ts`) i "jak dostarczyć" (statyczny plik vs. wygenerowany na żądanie) — dodanie Feature 1 wymagałoby dotknięcia zarówno typu `Document`, jak i tego jedynego call site'u.
2. **Blast radius nieznanego rozmiaru dla Feature 1**: research wyklucza 4 z 6 rozważanych opcji (`@react-pdf/renderer` blokowany przez WASM na Cloudflare, `pdf-lib` porzucony, client-side LLM 3-8GB/2-5min ładowania, zewnętrzny LLM = RODO-niebezpieczny) — pozostają tylko `window.print()`/`jsPDF`, oba wymagające napisania szablonów HTML od zera, czego dziś nie ma.
3. **Brak procesu aktualizacji danych dla Feature 2**: progi dochodowe = mnożnik najniższej emerytury (aktualizowanej 1 marca), brak publicznego API — wymagałoby ręcznego monitorowania Dzienników Urzędowych i komentarza `// last verified:` bez zautomatyzowanego mechanizmu przypomnienia (Open Question #4 w research.md).

## 4. Plan refaktoryzacji (z L4)

**Co refaktoryzowane**: sześć pozycji, ale najwyżej priorytetyzowana w L4 to sprzeczna dokumentacja auth (`CLAUDE.md` opisuje nieistniejący Supabase auth system, podczas gdy `AGENTS.md` poprawnie stwierdza brak auth) oraz martwy plik `README.md.scaffold` powielający tę samą nieaktualną narrację. Docelowy kształt: `CLAUDE.md` skorygowany lub usunięty na rzecz `AGENTS.md`; `README.md.scaffold` usunięty.

**Czego świadomie NIE robimy**: nie dzielimy `tree.ts` na pliki per-case-type *zanim* drugie miasto zostanie faktycznie zaplanowane (pozycja 3, "can wait" — "premature splitting before a second city is scoped risks guessing wrong about the right seam"); nie usuwamy `Banner.astro`/`LibBadge.astro` bez decyzji, czy `Banner.astro` posłuży za przyszły disclaimer; nie centralizujemy numeracji FR poza tym, co `prd.md` już robi (pozycja 4 nie proponuje zmiany kodu).

**Fazy planu**:
- **Do first #1** — korekta `CLAUDE.md`/`AGENTS.md` (sekcje Architecture, Auth flow, CI branch/steps) → weryfikacja: ręczna (przegląd treści dokumentu wobec `find src -type f`).
- **Do first #2** — usunięcie `README.md.scaffold` → weryfikacja: ręczna (potwierdzenie że `README.md` już zawiera poprawną treść).
- **Can wait #3** — wydzielenie współdzielonych fragmentów `tree.ts` (duplikat `dzika-eksmisja`) do stałej → weryfikacja: docelowo automatyczna (test integralności danych, patrz sekcja 5).
- **Can wait #4** — brak zmiany kodu, tylko konwencja "FR = code comment + prd.md entry od teraz" → weryfikacja: ręczna, przy każdym future PR.
- **Can wait #5** — usunięcie `Banner.astro`/`LibBadge.astro` → weryfikacja: automatyczna (`grep` potwierdzający brak importów, już wykonany w L4).
- **Can wait #6** — test integralności danych `tree.ts` (filename→plik, kompletność 6 języków) → weryfikacja: automatyczna (nowy plik Vitest, brak DOM).

## 5. Domena wg DDD (z L5)

**Ubiquitous language — 3-5 kluczowych pojęć**: *City* (węzeł najwyższy, tylko `warszawa` zasiane), *CaseType→Stage→SubType?→Document* (hierarchia drzewa), *resultStage* (węzeł wynikowy, dokładnie jeden per ścieżka), *DocumentType* (taksonomia adresata: letter/court/police, nie formatu), *deriveWizardNodes* (czysta funkcja routingu, `.find()` bez fuzzy matching).

**Najważniejsze rozjazdy model-vs-kod** (z `01-domain-distillation.md`, KROK 4): D-1/D-2 — dokumentacja sugeruje zakończoną konsolidację poddrzewa `dzika-eksmisja`/`odciecie-mediow` (commit `4c49cd0`), ale późniejszy commit (`8d7bf64`) odtworzył ten sam fragment jako duplikat pod `wypowiedzenie→termin-minal` — potwierdzone linia-po-linii (`tree.ts:85-251` vs `tree.ts:569-735`). D-4/D-7 — reguła "Stage ma documents XOR subTypes" jest deklarowana komentarzem typu (`types.ts:47`), ale **niewymuszona przez system typów** (`documents?`/`subTypes?` są niezależnymi opcjonalnymi polami). D-6 — martwy string `selectCity` w `ui.ts:4-11`, osierocony po usunięciu ekranu wyboru miasta, nieodnotowany dotąd w żadnym wcześniejszym dokumencie.

**Niezmiennik #1 i agregat**: **Inwariant A** — "każdy osiągalny węzeł terminalny prowadzi do ≥1 `Document`, i każdy `Document.filename` wskazuje na plik istniejący pod `public/documents/warszawa/`" — wybrany, bo jest jednocześnie najbardziej rdzenny dla definicji sukcesu produktu (`prd.md:26`, "holding a relevant PDF") i najsłabiej wymuszony (zero mechanizmów: brak w typie, CI, testach, build). Należy do zaprojektowanego agregatu **`DecisionTreeCatalog`** — korzeń to cała struktura `DecisionTree` (`City[]`), z prywatnym konstruktorem i metodą `create()` rzucającą `DecisionTreeIntegrityError`, gdy walidacja się nie powiedzie; agregat nie ma jeszcze implementacji w kodzie (BRAK w kodzie — to plan, `02-invariant-aggregate-refactor.md`).

**Anti-Corruption Layer**: przecieka kształt "dokument = statyczny plik PDF bez pól AcroForm", zakodowany w `Document.filename: string` (`types.ts:29-30`), powtórzony jako 16 literałów w `tree.ts`, i skonsumowany przez **1 warstwę bezpośredniego użycia** — `href={doc.filename} download` w `Wizard.tsx:301-307` (jedyny call site poza definicją typu/danych, potwierdzone `grep -rn "\.filename" src/`, KROK 6 dokumentu `03-anti-corruption-layer.md`). Mimo małej liczby plików (3), koszt wymiany jest wysoki, bo nie istnieje dziś żaden adapter — cała wiedza "jak dostarczyć dokument" jest wtopiona w jedno pole typu i jedną linijkę JSX. Proponowany port: `DocumentDelivery.resolve(document): DeliveryResult`, z `StaticFileDelivery` jako jedynym dzisiejszym adapterem (BRAK w kodzie — plan).

## 6. Decyzje, które należą do mnie

Ten raport i trzy poprzedzające go dokumenty domenowe (L5) zostały przygotowane przez AI w tej sesji na zlecenie Zenobii Gawlikowskiej. Decyzje, które faktycznie podjęła ona: zdecydowała się zastosować techniki DDD (destylacja domeny, projekt agregatu wokół inwariantu, warstwa antykorupcyjna) bezpośrednio do tego repozytorium, zamiast najpierw wyszukiwać dokładne treści promptów z lekcji kursu; zdecydowała się zachować wcześniejsze, bardziej ogólne notatki domenowe (`ubiquitous-language.md`, `bounded-contexts.md`) obok nowych, bardziej precyzyjnych plików L5, zamiast je zastępować; zdecydowała się objąć procesem to jedno repozytorium (`asystent-lokatorski`) w całości, w tym artefakt L3, mimo niezgodnego pola `repository` w jego frontmatterze; oraz zdecydowała się wcześniej w tej pracy na push i merge zmian do `main`.

Osądy architektoniczne wewnątrz tego zakresu — które konkretnie ryzyko/inwariant/kandydat na ACL wybrać jako "#1", jak nazwać i zaprojektować agregat `DecisionTreeCatalog`, jaki kształt miałby mieć port `DocumentDelivery` i `DeliveryResult` — zostały wypracowane przez AI w oparciu o ranking wartość×ryzyko opisany w artefaktach L5, nie są jej osobistymi ustaleniami merytorycznymi.

**Draft only — the lesson expects you to read this like a reviewer and rewrite this section in your own words before submitting; it should describe decisions you actually made, not summarize what was generated for you.**
