---
title: Invariant & Aggregate Refactor Plan — Asystent Lokatorski
created: 2026-07-09
type: refactor-plan
---

# Plan ochrony inwariantu i refaktoryzacji ku agregatowi — Asystent Lokatorski

> Dokument planistyczny. Nie zawiera zmian w kodzie produkcyjnym. Każde twierdzenie faktyczne jest opatrzone cytatem plik:linia zweryfikowanym osobiście podczas pisania tego dokumentu. Tam, gdzie coś w kodzie faktycznie nie istnieje, napisano to wprost: **BRAK w kodzie**.

---

## KROK 0 — Odkrycie kontekstu

Dokumenty fundacyjne istnieją i zostały odczytane w całości:

- `context/foundation/prd.md` — pełny PRD (wizja, persona, kryteria sukcesu, FR-001…FR-008, NFR, logika biznesowa, model danych, strategia testów).
- `context/architecture/repo-map.md` — mapa repozytorium plik-po-pliku.
- `context/architecture/refactoring-plan.md` — lista 6 zweryfikowanych pozycji do refaktoryzacji, w tym pozycja 6 dot. integralności `tree.ts`.
- `context/domain/bounded-contexts.md` — konteksty: Routing (żywy), Document (żywy, zrośnięty z Routing), Eligibility (niezbudowany, tylko zbadany).

**Sekcja "Business logic" w PRD** (`context/foundation/prd.md:95-99`) stwierdza wprost jedną zasadą: *"the case-routing decision tree IS the business logic... each path through the tree resolves to exactly one resultStage"*. To jest jedyna reguła domenowa nazwana explicite jako "the business logic" w całym projekcie.

**Sekcja "Success criteria"** (`context/foundation/prd.md:24-29`) — najważniejsze dla tego planu jest kryterium: *"A tenant can go from landing on the page to holding a relevant PDF in 3–5 taps"* oraz *"no dead end"* (poprzez FR-002, escape hatch). Skuteczność produktu = tenant zawsze dostaje **prawdziwy, ściągalny dokument** na końcu ścieżki — nie stronę 404 po kliknięciu "Pobierz".

**Stos i warstwy, w których żyje logika biznesowa:**
- Dane/reguły domenowe: `src/data/tree.ts` (835 linii, jeden `City` — `warszawa`, 5 `CaseType`) i `src/data/types.ts` (79 linii, definicje typów `Document`/`Stage`/`SubType`/`CaseType`/`City`/`Step`).
- Czysta logika wyprowadzania stanu: `src/lib/wizard-state.ts` (72 linie) — `deriveWizardNodes`, `appendStep`, `popStep`, `resetSteps`, `stepCount`, `stepNumber`.
- Warstwa prezentacji/orkiestracji: `src/components/Wizard.tsx` (335 linii) — jedyny komponent React, właściciel stanu `history: Step[]` i `lang`.
- Testy: `tests/wizard-state.test.ts` (246 linii) — 29 testów Vitest.

Aplikacja jest **czysto kliencka** po pierwszym renderze SSR: `context/architecture/repo-map.md:134` — *"There is no server round-trip anywhere in this flow after the initial page load"*. Nie ma bazy danych, API route'ów obsługujących logikę domenową, ani stanu serwerowego (`context/foundation/prd.md:92-93`, NFR-PERF-01 i NFR-PRIV-01).

---

## KROK 1 — Identyfikacja inwariantów biznesowych

Poniżej lista reguł, które MUSZĄ być prawdziwe w tej domenie, wyprowadzonych z dokumentów i z kodu.

### Inwariant A — Integralność danych drzewa: każdy osiągalny węzeł terminalny prowadzi do realnego dokumentu

**Treść**: każdy `Stage`/`SubType`-owy węzeł osiągalny z drzewa musi ostatecznie rozwiązać się do niepustej tablicy `Document[]`, i każdy `Document.filename` musi wskazywać na plik istniejący pod `public/documents/warszawa/`.

**Źródła**:
- `context/foundation/prd.md:127` — *"no test coverage of tree.ts's actual content, e.g., no automated check that every Stage/SubType node terminates in at least one Document, or that every referenced filename exists under public/documents/warszawa/"*.
- `context/architecture/repo-map.md:100` — *"Each Document.filename in tree.ts is a literal path under this directory... no server-side lookup, no manifest, no build-time validation that a referenced file actually exists on disk."*
- `context/architecture/refactoring-plan.md:51` — *"a missing or misspelled filename would only surface as a broken download link discovered by a real tenant, not by CI"*.
- Kodowo: `src/data/types.ts:44-50` — komentarz na `Stage`: *"Either documents (terminal) or subTypes (one more level of navigation)"* — to jest deklaracja typu, nie wymuszenie w runtime (oba pola są opcjonalne: `documents?: Document[]; subTypes?: SubType[];`).
- Konsumowane w `src/components/Wizard.tsx:286` — `(resultStage.documents ?? []).map(...)` — pusta tablica jest cichym fallbackiem.

### Inwariant B — Historia nawigacji nigdy nie jest pusta i nigdy nie schodzi poniżej `caseType`

**Treść**: stos `Step[]` (historia wizarda) ma zawsze co najmniej jeden element; `popStep` nigdy nie usuwa ostatniego pozostałego wpisu.

**Źródła**:
- `src/data/types.ts:73` — komentarz: *"The history stack (Step[]) is always non-empty; the last element is active."*
- `src/lib/wizard-state.ts:28-31` — implementacja: `// Guard: if history has only one entry, do not pop (stay on first screen). export function popStep(history: Step[]): Step[] { return history.length > 1 ? history.slice(0, -1) : history; }`
- `src/components/Wizard.tsx:97-100` — inicjalizacja `useState<Step[]>([{ id: "caseType" }])` + komentarz *"history is always non-empty (initialized with caseType step, never cleared to [])"*.
- Testy: `tests/wizard-state.test.ts:89-113` (opis `popStep`) — pokrywają dokładnie ten guard.

### Inwariant C — Deterministyczna, jednoznaczna ścieżka: jeden `Step` → co najwyżej jeden `resultStage`

**Treść**: dla danego `Step` i `City`, `deriveWizardNodes` zwraca zawsze te same węzły — bez losowości, bez punktacji, bez rankingu. Każda ścieżka przez drzewo rozwiązuje się do dokładnie jednego `resultStage`.

**Źródła**:
- `context/foundation/prd.md:97` — *"each path through the tree resolves to exactly one resultStage"*.
- `context/domain/bounded-contexts.md:11` — *"stateless and deterministic... no randomness, no external calls, no time-dependence"*.
- Kodowo: `src/lib/wizard-state.ts:48-71` — `deriveWizardNodes` to czyste wyszukiwanie po `.find()`, bez efektów ubocznych.

### Inwariant D — Reguła kształtu węzła `Stage`: albo liść z dokumentami, albo rozdroże z podtypami, nigdy oba naraz

**Treść**: zgodnie z własnym komentarzem typu (`src/data/types.ts:47`, *"Either documents (terminal) or subTypes (one more level of navigation)"*), węzeł `Stage` powinien mieć albo `documents`, albo `subTypes`, nigdy jednocześnie oba i nigdy żadnego z nich.

**Źródła**:
- `src/data/types.ts:44-50` — deklaracja interfejsu `Stage` z oboma polami opcjonalnymi (`documents?: Document[]; subTypes?: SubType[];`) — **nic w typie nie wymusza „exactly one of"**; TypeScript pozwoliłby na `Stage` z oboma polami ustawionymi, lub z żadnym.
- Kodowo sprawdzone (patrz KROK 3): logika rozstrzygająca w `Wizard.tsx:220-226` sprawdza `s.subTypes?.length` żeby zdecydować, dokąd nawigować — **nie sprawdza**, czy `documents` jest też ustawione.

### Inwariant E — Brak PII / brak trwałego stanu domenowego tenanta

**Treść**: aplikacja nigdzie nie zbiera, nie przechowuje i nie przesyła danych osobowych; jedyny trwały stan to preferencja językowa w `localStorage`.

**Źródła**:
- `context/foundation/prd.md:93` — NFR-PRIV-01: *"No PII is collected, stored, or transmitted anywhere in the app... This is a load-bearing design choice, not an accidental gap."*
- Kodowo: `src/components/Wizard.tsx:107,117` — jedyne wywołania `localStorage` dotyczą klucza `"kopl-lang"`.

### Inwariant F — Kompletność lokalizacji: każdy `LocalizedString` ma wszystkie 6 kluczy `Lang` z niepustą wartością

**Treść**: każdy widoczny dla użytkownika string (label/description/name/note) powinien mieć wypełnione wszystkie 6 języków (`pl/ua/ru/en/es/fr`).

**Źródła**:
- `context/architecture/refactoring-plan.md:51` — *"nothing currently checks that required fields like name/description/label are complete for all 6 languages across all 5 case types"*.
- Kodowo: `src/data/types.ts:16` — `LocalizedString = Record<Lang, string>` — typ **wymusza obecność klucza**, ale **nie wymusza niepustości stringa** (`""` przechodzi typecheck, co widać np. w fixture testowym `tests/wizard-state.test.ts:134` — `ua: "", ru: "", en: "", es: "", fr: ""`).

### Kandydaci rozważeni i odrzuceni jako #1 — uzasadnienie

- **Inwariant B (historia)** — jest już w pełni wymuszony w jedynym miejscu, gdzie mógłby zostać złamany (`popStep`, `src/lib/wizard-state.ts:29-31`), i pokryty testami (`tests/wizard-state.test.ts:89-113`). Rdzenny dla UX, ale **enforcement jest mocny i scentralizowany** — nie jest to najsłabiej chronione miejsce.
- **Inwariant C (determinizm ścieżki)** — również w pełni wymuszony strukturalnie: `deriveWizardNodes` jest czystą funkcją, `.find()` z natury zwraca 0 lub 1 wynik; nie ma mechanizmu, który mógłby zwrócić więcej niż jeden `resultStage`. Ryzyko złamania jest praktycznie zerowe przy obecnej implementacji.
- **Inwariant E (brak PII)** — silnie chroniony przez brak jakiegokolwiek formularza w UI i przez usunięcie scaffoldingu Supabase (`context/foundation/prd.md:116-117`, commity `2348ec9`/`5e88a57`/`b034eab`). To jest bardziej **nieobecność funkcjonalności** niż inwariant aktywnie testowany przy każdej operacji — trudno go "złamać" przez przypadek, bo nie ma mechanizmu zbierania danych, który mógłby to zrobić.
- **Inwariant F (kompletność lokalizacji)** — realny i słabo chroniony (typ nie wymusza niepustości), ale **mniej core dla znaczenia produktu**: brakujący string w jednym z 6 języków degraduje UX (pokazuje się puste miejsce), ale nie blokuje tenanta przed otrzymaniem dokumentu. To jest inwariant drugorzędny względem A.
- **Inwariant D (kształt Stage)** — realny i faktycznie niewymuszony w typie. Wybrany jako **silny kandydat #2** — patrz KROK 2, gdzie jest porównany wprost z Inwariantem A.
- **Inwariant A (integralność drzewa: dokument→plik)** — wybrany jako #1. Uzasadnienie w KROK 2.

---

## KROK 2 — Klasyfikacja i wybór #1

Każdy inwariant oceniony na trzech osiach: **(a)** jak rdzenny dla znaczenia produktu, **(b)** jak rozmazany między warstwami/plikami, **(c)** czy faktycznie WYMUSZONY, tylko zadeklarowany, czy naruszalny.

| Inwariant | (a) Rdzenność dla produktu | (b) Rozmazanie | (c) Stan wymuszenia |
|---|---|---|---|
| A — dokument→plik istnieje | **Bardzo wysoka.** Kryterium sukcesu PRD to literalnie "holding a relevant PDF" (`prd.md:26`). Jeśli plik nie istnieje, produkt nie realizuje swojego jedynego celu. | Rozmazany na 3 miejsca: dane (`tree.ts`), filesystem (`public/documents/warszawa/`), UI-konsument (`Wizard.tsx:301-307`, link `<a href download>`). Żadne z tych miejsc nie odwołuje się do innego w czasie budowania/testowania. | **Naruszalny, niewymuszony nigdzie.** Brak testu, brak walidacji build-time, brak manifestu. Obecnie trzyma się (patrz KROK 3), ale wyłącznie przez dyscyplinę autora treści, nie przez system. |
| B — historia niepusta | Wysoka (bez tego UX się psuje — użytkownik "wypada" z wizarda), ale nie wpływa na to, czy dokument jest poprawny. | Skoncentrowany w jednym miejscu (`wizard-state.ts:29-31`). | **W pełni wymuszony i przetestowany.** |
| C — determinizm ścieżki | Wysoka konceptualnie, ale przy obecnej implementacji praktycznie niezłamywalna. | Skoncentrowany (`deriveWizardNodes`). | **Wymuszony strukturalnie** (własność `.find()` + czystość funkcji). |
| D — Stage: liść XOR rozdroże | Średnio-wysoka — błąd tu prowadziłby do martwej ścieżki (rozdroże bez `subTypes` i bez `documents`) albo do niejednoznaczności (oba pola ustawione, UI wybiera jedno wg własnej reguły). | Rozmazany między deklaracją typu (`types.ts:47`, tylko komentarz) i logiką odczytu (`Wizard.tsx:220-226`, `258-262`, `282-286`). | **Zupełnie niewymuszony.** Typ pozwala na `Stage` z oboma polami lub z żadnym; nic tego nie sprawdza. |
| E — brak PII | Wysoka (NFR-PRIV-01), ale chroniona przez nieobecność funkcji, nie przez aktywną regułę domenową do "pilnowania". | N/D — nie ma mechanizmu zbierania danych do złamania. | Wymuszony przez brak infrastruktury (nie ma czego złamać). |
| F — kompletność lokalizacji | Średnia — degraduje UX, nie blokuje rezultatu. | Rozmazany przez cały `tree.ts` (835 linii × 6 języków × wiele pól). | Niewymuszony (typ nie sprawdza niepustości). |

**Wybór #1: Inwariant A — "każdy osiągalny węzeł terminalny (Stage/SubType/SubStage) prowadzi do co najmniej jednego Document, i każdy Document.filename istnieje pod public/documents/warszawa/".**

**Uzasadnienie wyboru** (nie domyślne przyjęcie sugestii poprzedniego przebiegu, lecz świadome porównanie):

1. Inwariant A jest **jedynym** z sześciu, który jednocześnie ląduje w górnym-lewym rogu matrycy: najwyższa rdzenność (to *jest* definicja sukcesu produktu z `prd.md:26`) **i** najsłabsze wymuszenie (zero — nie deklaratywne, nie runtime, nie testowe, nie build-time).
2. Inwariant D jest bliskim konkurentem — również niewymuszony — ale jego rdzenność jest niższa: złamanie D (Stage z oboma polami lub żadnym) w praktyce *dzisiaj* nie występuje (zweryfikowane strukturalnie w KROK 3), a nawet gdyby wystąpiło, najgorszy scenariusz to martwa ścieżka nawigacji, nie brakujący dokument prawny — Inwariant A odpowiada bezpośrednio za to, czy tenant w kryzysie (persona z `prd.md:18-22`, "stressed, time-pressured") dostaje działający dokument czy stronę błędu.
3. Inwariant B i C są rdzenne, ale **już wymuszone** — wybór jednego z nich jako "#1 do naprawienia" byłby fałszywym alarmem; nie ma tu nic do zaprojektowania, poza być może formalizacją.
4. Inwariant A ma też najgorszy profil ryzyka *cichej* awarii: błąd nie objawia się przy starcie aplikacji, nie objawia się w konsoli, nie jest wykrywany przez `npm run lint` ani `npm run build` (Astro/Vite nie analizuje statycznie stringów-ścieżek w tablicy danych) — objawia się wyłącznie wtedy, gdy realny tenant w realnym kryzysie klika "Pobierz" i dostaje 404 z Cloudflare Workera. To jest dokładnie scenariusz "fail-fast" tego planu ma wyeliminować, przenosząc wykrycie z runtime-u-u-tenanta na czas budowania/testowania.

Inwariant D jest **potraktowany jako #2** i wspomniany w projekcie agregatu (KROK 4) jako drugorzędna reguła strażnika tego samego agregatu, ponieważ współdzieli te same dane wejściowe.

---

## KROK 3 — Diagnoza wybranego inwariantu (A)

### Gdzie reguła "żyje" dzisiaj — warstwa po warstwie

**Warstwa danych (deklaracja intencji, brak wymuszenia)**
- `src/data/types.ts:29-30` — komentarz na `Document.filename`: *"Path under /public/documents/, always a Polish-language file"* — to jest **komentarz**, nie typ. Typ `filename: string` (`types.ts:30`) przyjmie dowolny string, w tym pusty, w tym z literówką, w tym wskazujący na nieistniejący plik.
- `src/data/tree.ts` — 16 wystąpień `filename:` (linie: 61, 133, 162, 204, 246, 301, 360, 402, 487, 550, 617, 646, 688, 730, 785, 819), redukujących się do **12 unikalnych ścieżek** (4 duplikaty pochodzą z zamierzonego, ale niewymuszonego typem, powielenia poddrzewa `dzika-eksmisja`/`termin-minal` — potwierdzone w `context/architecture/refactoring-plan.md:27`).

**Warstwa filesystemu (prawda, z którą nic nie jest porównywane automatycznie)**
- `public/documents/warszawa/` zawiera dokładnie 12 plików PDF (zweryfikowane `find`): `naruszenie-posiadania.pdf`, `nekanie-odciecie-mediow.pdf`, `odpowiedz-pozew-eksmisja.pdf`, `oswiadczenie-obnizenie-czynszu.pdf`, `pozew-prawo-do-lokalu-art691.pdf`, `pozew-ustalenie-niezasadnosci-podwyzki.pdf`, `skarga-uchwaly.pdf`, `sprzeciw-wypowiedzenie.pdf`, `wezwanie-obnizenie-czynszu-prywatny.pdf`, `wezwanie-przywrocenie-mediow.pdf`, `wezwanie-uzasadnienie-podwyzki.pdf`, `zazalenie-umorzenie.pdf`.
- **Stan faktyczny (zweryfikowany osobiście dla tego dokumentu)**: wszystkie 12 unikalnych `filename` z `tree.ts` rozwiązują się 1:1 do plików na dysku. Zgodność jest **całkowita w chwili pisania tego dokumentu**, ale trzyma się wyłącznie przez przypadek dyscypliny autora — nie przez żaden mechanizm.

**Warstwa konsumująca — UI (jedyny "strażnik", i to bierny)**
- `src/components/Wizard.tsx:286` — `{(resultStage.documents ?? []).map((doc) => (...))}`. Jeśli `resultStage.documents` jest `undefined` (np. błąd autorski: `Stage` ma tylko `subTypes`, ale dotarto do niego jako do węzła terminalnego), kod **nie wyrzuca błędu — cicho renderuje zero kart dokumentów**. To jest klasyczny "swallowed error": operacja (dotarcie do wyniku) kończy się sukcesem z punktu widzenia Reacta, a tenant widzi puste `<h2>Twój dokument</h2>` bez żadnej karty i bez komunikatu o błędzie.
- `src/components/Wizard.tsx:301-307` — `<a href={doc.filename} download>` — jeśli `doc.filename` nie istnieje na dysku, przeglądarka wykona żądanie GET, Cloudflare Worker/statyczny host zwróci 404, i **nic w aplikacji React tego nie przechwytuje** — to jest zdarzenie poza cyklem życia komponentu, niewidoczne dla żadnego error boundary, bo `<a>` z atrybutem `download` nie jest fetchem zarządzanym przez JS.

### Które warstwy NIE wymuszają reguły
- **Typ (`types.ts`)**: nie wymusza (string dowolny, opcjonalne pola).
- **Build (`astro build`, `tsc`)**: nie wymusza — TypeScript sprawdza tylko zgodność typów, nie treść stringów ani istnienie plików na dysku.
- **CI (`.github/workflows/ci.yml`)**: kroki to `checkout → setup-node → npm ci → astro sync → lint → test → build` — żaden z nich nie porównuje `tree.ts` z zawartością `public/documents/warszawa/`.
- **Testy (`tests/wizard-state.test.ts`)**: **zweryfikowano osobiście przez odczyt całego pliku** — import na górze pliku to wyłącznie `import type { City, Step } from "@/data/types";` i `import { appendStep, deriveWizardNodes, popStep, resetSteps, stepCount, stepNumber } from "@/lib/wizard-state";` (linie 3-4). **Plik `tests/wizard-state.test.ts` nigdy nie importuje `src/data/tree.ts`.** Fixture `CITY` (linie 132-181) jest ręcznie zbudowanym obiektem z dwoma przykładowymi dokumentami (`/docs/pismo.pdf`, `/docs/pozew.pdf` — linie 140, 153) — ścieżki te **nie odpowiadają żadnemu realnemu plikowi** i nigdy nie są sprawdzane pod kątem istnienia na dysku, bo test dotyczy wyłącznie logiki wyprowadzania węzłów (`deriveWizardNodes`), nie treści drzewa produkcyjnego.
- **Runtime**: jedyny "sprawdzacz" to przeglądarka tenanta w momencie kliknięcia "Pobierz" — a to jest already-too-late.

### Gdzie klient (UI) jest jedynym strażnikiem
Nie jest nawet strażnikiem — `Wizard.tsx:286` to fallback (`?? []`), który **maskuje** problem (brak kart) zamiast go zgłaszać, a `Wizard.tsx:301-307` to zwykły link, który **nie ma żadnej logiki strażniczej** — po prostu ufa, że `filename` jest poprawny.

### Gdzie błąd jest "połykany" zamiast zatrzymywać operację
Dokładnie w `Wizard.tsx:286`: `resultStage.documents ?? []`. To jest wzorzec "log-and-continue" bez nawet logowania — cichy fallback do pustej tablicy, gdy semantycznie poprawne zachowanie (przy złamanym Inwariancie A lub D) powinno być: zatrzymać się i zasygnalizować błąd dużo wcześniej — najlepiej w czasie budowania, zanim kod trafi na produkcję.

---

## KROK 4 — Projekt agregatu strażnika

### Nazwa i granica agregatu

**`DecisionTreeCatalog`** (pl. *Katalog Drzewa Decyzyjnego*) — agregat, którego korzeniem jest cała struktura `DecisionTree` (`City[]`) dla jednego wdrożenia (dziś: tylko `warszawa`). To jest naturalna granica transakcyjna, bo:
- Inwariant A wymaga **globalnego** spojrzenia na drzewo (każdy węzeł, każdy plik) — nie da się zweryfikować go per-`Stage` w izolacji, bo trzeba też znać cały zestaw plików na dysku.
- Inwariant D (kształt `Stage`) jest lokalny per-węzeł, ale najsensowniej sprawdzany w tym samym przebiegu walidacji co A, bo to ten sam agregat i te same dane wejściowe.

### Sygnatury metod domenowych

```typescript
// Domyślny błąd domenowy — rzucany, nie zwracany jako wartość, nie logowany-i-ignorowany.
class DecisionTreeIntegrityError extends Error {
  constructor(
    public readonly violations: TreeIntegrityViolation[],
  ) {
    super(
      `DecisionTreeCatalog integrity violated: ${violations.length} problem(s) found`,
    );
    this.name = "DecisionTreeIntegrityError";
  }
}

type TreeIntegrityViolation =
  | { kind: "MISSING_DOCUMENT_FILE"; documentId: string; path: string[]; filename: string }
  | { kind: "STAGE_WITHOUT_TERMINAL_OR_BRANCH"; stageId: string; path: string[] } // ani documents, ani subTypes
  | { kind: "STAGE_WITH_BOTH_TERMINAL_AND_BRANCH"; stageId: string; path: string[] } // oba naraz — narusza inwariant D
  | { kind: "EMPTY_DOCUMENTS_ARRAY"; stageId: string; path: string[] } // documents: [] — technicznie "terminal", ale bez treści
  | { kind: "INCOMPLETE_LOCALIZATION"; nodeId: string; field: string; missingLangs: Lang[] }; // inwariant F, opcjonalnie w tym samym przebiegu

class DecisionTreeCatalog {
  private constructor(
    private readonly cities: City[],
    private readonly availableFiles: ReadonlySet<string>, // znormalizowane ścieżki z public/documents/**
  ) {}

  // Jedyny sposób powstania instancji — konstruktor jest prywatny.
  // Wymusza inwarianty A i D PRZED zwróceniem obiektu. Nielegalny stan nigdy nie istnieje.
  static create(cities: City[], availableFiles: ReadonlySet<string>): DecisionTreeCatalog {
    const violations = DecisionTreeCatalog.checkIntegrity(cities, availableFiles);
    if (violations.length > 0) {
      throw new DecisionTreeIntegrityError(violations);
    }
    return new DecisionTreeCatalog(cities, availableFiles);
  }

  // Czysta funkcja walidacji — używana też bezpośrednio w testach, bez konstruowania agregatu.
  static checkIntegrity(
    cities: City[],
    availableFiles: ReadonlySet<string>,
  ): TreeIntegrityViolation[] {
    const violations: TreeIntegrityViolation[] = [];
    for (const city of cities) {
      for (const caseType of city.caseTypes) {
        for (const stage of caseType.stages) {
          walkStage(stage, [city.id, caseType.id], violations, availableFiles);
        }
      }
    }
    return violations;
  }

  // Jedyna metoda odczytu udostępniana konsumentom (Wizard.tsx) —
  // zastępuje bezpośredni import `tree` + `.find()` rozsiany po komponencie.
  findCity(cityId: string): City | undefined {
    return this.cities.find((c) => c.id === cityId);
  }
}

// Rekurencyjny helper — wymusza inwariant D (XOR) i A (documents niepuste + pliki istnieją) na każdym poziomie.
function walkStage(
  stage: Stage,
  path: string[],
  violations: TreeIntegrityViolation[],
  availableFiles: ReadonlySet<string>,
): void {
  const hasDocs = !!stage.documents;
  const hasSubTypes = !!stage.subTypes;

  if (!hasDocs && !hasSubTypes) {
    violations.push({ kind: "STAGE_WITHOUT_TERMINAL_OR_BRANCH", stageId: stage.id, path });
    return; // fail-fast na tym węźle — nie ma sensu iść dalej
  }
  if (hasDocs && hasSubTypes) {
    violations.push({ kind: "STAGE_WITH_BOTH_TERMINAL_AND_BRANCH", stageId: stage.id, path });
  }
  if (hasDocs) {
    if (stage.documents!.length === 0) {
      violations.push({ kind: "EMPTY_DOCUMENTS_ARRAY", stageId: stage.id, path });
    }
    for (const doc of stage.documents!) {
      if (!availableFiles.has(doc.filename)) {
        violations.push({
          kind: "MISSING_DOCUMENT_FILE",
          documentId: doc.id,
          path,
          filename: doc.filename,
        });
      }
    }
  }
  if (hasSubTypes) {
    for (const subType of stage.subTypes!) {
      for (const subStage of subType.stages) {
        walkStage(subStage, [...path, stage.id, subType.id], violations, availableFiles);
      }
    }
  }
}
```

**Precondycje i błędy nazwane**: `DecisionTreeCatalog.create` jest **jedynym** miejscem, w którym instancja agregatu może powstać, i rzuca `DecisionTreeIntegrityError` (błąd nazwany, nie `Error` generyczny, nie `null`, nie cichy fallback) natychmiast, gdy którykolwiek węzeł narusza inwariant A lub D. Nie ma ścieżki kodu, przez którą "zepsuty" katalog mógłby zostać użyty przez `Wizard.tsx` — jeśli `create()` nie rzuci, gwarantowane jest, że każdy `Document.filename` wskazuje na plik istniejący (w chwili walidacji) i każdy `Stage` ma dokładnie jeden sposób terminacji.

### Repozytorium — ładowanie/zapisywanie zamiast rozsianych odpytań

```typescript
interface DecisionTreeCatalogRepository {
  // Ładuje surowe dane (dziś: import statyczny z tree.ts) + listę plików z filesystemu
  // i konstruuje agregat — walidacja dzieje się TU, raz, przy starcie, nie przy każdym renderze.
  load(): DecisionTreeCatalog; // rzuca DecisionTreeIntegrityError jeśli dane są uszkodzone
}

// Implementacja dla tego konkretnego, statycznego, bez-bazodanowego kontekstu:
class StaticFileSystemCatalogRepository implements DecisionTreeCatalogRepository {
  load(): DecisionTreeCatalog {
    const files = listFilesUnder("public/documents"); // Node fs.readdirSync w build-time/testowym kontekście
    return DecisionTreeCatalog.create(tree, new Set(files));
  }
}
```

**Uwaga o "transakcji" — bądźmy szczerzy o tym, co ten termin tu znaczy.** Ta aplikacja nie ma bazy danych i nie wykonuje żadnych zapisów (`context/foundation/prd.md:103` — *"There is effectively no persisted user data model"*). "Transakcja" w klasycznym sensie ACID **nie ma tu zastosowania** — nie ma dwóch operacji zapisu, które mogłyby się rozjechać w połowie. To, co faktycznie odpowiada potrzebie atomowości, to: **walidacja całego katalogu musi się odbyć w jednym nierozdzielnym kroku, PRZED tym, jak jakikolwiek fragment drzewa stanie się dostępny do odczytu przez `Wizard.tsx`.** `DecisionTreeCatalog.create()` realizuje to poprzez rzucenie wyjątku zamiast zwrócenia częściowo poprawnego obiektu — to jest odpowiednik atomowości w świecie bez bazy danych: "wszystko albo nic" na poziomie konstrukcji obiektu w pamięci, nie na poziomie dysku.

### "Trasa API" — czy to pojęcie ma tu sens?

**Nie, i trzeba to powiedzieć wprost, żeby nie wymuszać fałszywej narracji.** Ta aplikacja nie ma żadnego serwerowego route'a obsługującego logikę domenową: jedyna trasa to `src/pages/index.astro`, która renderuje SSR-owo statyczny shell i hydratuje `<Wizard client:load />` (`context/architecture/repo-map.md:124`, `context/foundation/prd.md:92`). Nie ma `src/pages/api/*` obsługującego drzewo decyzyjne — jest tylko historyczne `src/pages/api/auth/*`, które i tak zostało usunięte (`context/foundation/prd.md:116-117`).

Więc "przeniesienie wymuszenia z klienta na serwer" **nie pasuje** do tej aplikacji w swojej klasycznej formie. Właściwe przeniesienie tutaj jest inne: **z runtime-u-tenanta (przeglądarka, klik "Pobierz", zbyt późno) na czas budowania (build-time / CI, execution poprzedzająca wdrożenie).** To jest realny odpowiednik "przenieś enforcement z klienta na serwer" w kontekście aplikacji statycznej: `DecisionTreeCatalogRepository.load()` wywoływane byłoby:
1. **W teście integralności** (Vitest, patrz KROK 5) — uruchamianym w CI przy każdym PR.
2. Opcjonalnie: **jako krok w `astro build`** (np. plugin Vite lub prosty skrypt Node w `package.json` `"prebuild"`), żeby build **nie powstał** przy złamanym inwariancie — to jest najbliższy odpowiednik "serwera odrzucającego nielegalne żądanie", jaki ta aplikacja może mieć, skoro nie ma serwera obsługującego domenę w runtime.

`Wizard.tsx` w wersji po refaktoryzacji **nie importowałby `tree` bezpośrednio** — importowałby wynik `catalogRepository.load().findCity("warszawa")`, wołany raz przy starcie modułu (nie w każdym renderze), z pewnością, że jeśli komponent się wyrenderował, katalog jest już zweryfikowany.

---

## KROK 5 — Przed/po, plan fazowy, testy

### Przed / po — każde miejsce, gdzie reguła żyje dzisiaj

| Miejsce | Przed | Po |
|---|---|---|
| `src/data/types.ts:24-35` (`Document` interface) | `filename: string` — brak wymuszenia | Bez zmian w typie samym (string i tak musi istnieć w danych statycznych) — wymuszenie przenosi się do agregatu, nie do typu. Komentarz na `filename` pozostaje, ale przestaje być jedynym "strażnikiem" — jest wyłącznie dokumentacją intencji. |
| `src/data/types.ts:44-50` (`Stage` interface) | `documents?: Document[]; subTypes?: SubType[];` — oba opcjonalne, XOR niewymuszony | Typ bez zmian (refaktoryzacja typu na discriminated union byłaby ładniejsza, ale to większa zmiana wykraczająca poza ten plan — patrz Faza 4 niżej jako opcjonalna). XOR wymuszony w `DecisionTreeCatalog.checkIntegrity` / `walkStage`. |
| `src/data/tree.ts` (835 linii, dane) | Konsumowane bezpośrednio przez `import { tree } from "@/data/tree"` w `Wizard.tsx:5` | Nadal jedyne źródło danych, ale konsumowane wyłącznie przez `StaticFileSystemCatalogRepository.load()`, nigdy bezpośrednio przez komponent UI. |
| `src/components/Wizard.tsx:5,103` (`import { tree }`, `tree.find(...)`) | Bezpośredni import i odpytanie surowej struktury | `const catalog = catalogRepository.load(); const city = catalog.findCity(CITY_ID);` — jeśli `load()` rzuciłby wyjątek, aplikacja by się nie zbudowała/nie wystartowała (patrz "build-time enforcement" wyżej), więc w praktyce `Wizard.tsx` zawsze operuje na już-zweryfikowanym katalogu. |
| `src/components/Wizard.tsx:286` (`resultStage.documents ?? []`) | Cichy fallback do pustej tablicy przy złamanym inwariancie | Ponieważ katalog jest zweryfikowany przy starcie, `resultStage.documents` **zawsze** istnieje i jest niepuste dla dowolnego osiągalnego `resultStage` — `?? []` może zostać, jako czysto techniczny type-guard dla TypeScript (bo typ nadal jest opcjonalny), ale semantycznie nie powinien już nigdy się aktywować w praktyce; jeśli się aktywuje, to sygnał regresji, którą powinien wcześniej złapać build/CI, nie tenant. |
| `tests/wizard-state.test.ts` | Testuje wyłącznie `wizard-state.ts` na ręcznym fixture; nie dotyka `tree.ts` | Bez zmian w tym pliku — pozostaje testem czystych funkcji nawigacyjnych. Nowy, **osobny** plik testowy (patrz niżej) dodaje pokrycie dla `DecisionTreeCatalog`. |
| CI (`.github/workflows/ci.yml`) | `npm ci → astro sync → lint → test → build` — brak kroku integralności drzewa | `npm test` obejmie nowy plik testowy integralności (bez zmian w samym workflow, bo `vitest run` już odpalane) — opcjonalnie dodać osobny krok `npm run build` z prebuild-hookiem, jeśli wybrana zostanie wersja build-time (Faza 3 niżej). |

### Plan fazowy

**Faza 0 — Test-first: napisać test integralności PRZED napisaniem agregatu.**
Zgodnie z dyscypliną test-first tego projektu (Vitest już obecny, `vitest.config.ts` już skonfigurowany z aliasem `@/`), pierwszym krokiem implementacyjnym (poza zakresem tego dokumentu — to plan, nie implementacja) powinien być nowy plik `tests/tree-integrity.test.ts`, który:
1. Importuje **prawdziwy** `tree` z `@/data/tree` (w przeciwieństwie do `wizard-state.test.ts`, które używa fixture) — to zamyka dokładnie tę dziurę pokrycia, którą nazwał `refactoring-plan.md:51`.
2. Odczytuje prawdziwą listę plików z `public/documents/warszawa/` (przez `fs.readdirSync` w kontekście node, zgodnym z `vitest.config.ts`'s `environment: "node"`).
3. Wywołuje `DecisionTreeCatalog.checkIntegrity(tree, new Set(files))` i asercjami sprawdza `violations.length === 0` dla realnych danych.

**Konkretne przypadki testowe (legalne i nielegalne operacje):**

*Legalne (obecny stan drzewa produkcyjnego powinien je spełniać):*
- `checkIntegrity(tree, realFiles)` zwraca `[]` (0 naruszeń) dla prawdziwego `tree.ts` i prawdziwych plików — to jest test regresji chroniący dokładnie ten stan, który dziś "trzyma się przez przypadek".
- `DecisionTreeCatalog.create(tree, realFiles)` nie rzuca wyjątku.
- Każdy z 12 unikalnych `filename` z `tree.ts` (zweryfikowanych: `sprzeciw-wypowiedzenie.pdf`, `wezwanie-przywrocenie-mediow.pdf`, `nekanie-odciecie-mediow.pdf`, `naruszenie-posiadania.pdf`, `zazalenie-umorzenie.pdf`, `odpowiedz-pozew-eksmisja.pdf`, `pozew-ustalenie-niezasadnosci-podwyzki.pdf`, `wezwanie-uzasadnienie-podwyzki.pdf`, `oswiadczenie-obnizenie-czynszu.pdf`, `wezwanie-obnizenie-czynszu-prywatny.pdf`, `skarga-uchwaly.pdf`, `pozew-prawo-do-lokalu-art691.pdf`) ma odpowiadający plik.

*Nielegalne (skonstruowane syntetyczne fixture, analogicznie do istniejącego stylu fixture w `wizard-state.test.ts:132-181`):*
- `Stage` z `documents: [{ ..., filename: "/documents/warszawa/nieistnieje.pdf" }]` i pustym `Set` plików → `checkIntegrity` zwraca naruszenie `MISSING_DOCUMENT_FILE`; `create()` rzuca `DecisionTreeIntegrityError`.
- `Stage` bez `documents` i bez `subTypes` → naruszenie `STAGE_WITHOUT_TERMINAL_OR_BRANCH`.
- `Stage` z **oboma** `documents` i `subTypes` ustawionymi → naruszenie `STAGE_WITH_BOTH_TERMINAL_AND_BRANCH` (test inwariantu D w tym samym przebiegu).
- `Stage` z `documents: []` (pusta tablica, technicznie "terminal", ale bez treści) → naruszenie `EMPTY_DOCUMENTS_ARRAY`.
- Wielokrotne naruszenia w jednym drzewie → `violations.length > 1`, wszystkie zaraportowane naraz (fail-fast nie znaczy "zgłoś tylko pierwszy błąd i przerwij" — znaczy "nie pozwól użyć niepoprawnego katalogu"; zebranie wszystkich naruszeń w jednym przebiegu jest lepsze dla developera naprawiającego dane, niż przerywanie na pierwszym).
- Wywołanie `catalog.findCity(...)` na instancji, która **nie mogła powstać** (bo `create()` rzuciło) — nie jest nawet możliwe do napisania jako test, co jest zamierzonym efektem: nielegalny stan nie ma reprezentacji w typie.

**Faza 1 — Zaimplementować `DecisionTreeCatalog`, `DecisionTreeIntegrityError`, `walkStage` w nowym pliku, np. `src/domain/decision-tree-catalog.ts`.**
Dopiero po tym, jak testy z Fazy 0 są napisane i czerwone (nie mają jeszcze implementacji do przetestowania — klasyczne red-green), zaimplementować kod tak, by testy przeszły.

**Faza 2 — Zaimplementować `StaticFileSystemCatalogRepository` i podłączyć go w `Wizard.tsx` zamiast bezpośredniego `import { tree }`.**
To wymaga rozwiązania praktycznego problemu: `fs.readdirSync` nie działa w kodzie hydratowanym w przeglądarce. Repozytorium w wersji produkcyjnej dla klienta powinno albo (a) wykonać listing plików w build-time i wygenerować statyczną listę wbudowaną do bundla, albo (b) wykonać walidację wyłącznie w teście/CI, a runtime-owy `Wizard.tsx` po prostu ufać już-zweryfikowanym danym (co jest uczciwym podejściem, bo aplikacja nie ma serwera, który mógłby to sprawdzić na żądanie — patrz szczera uwaga w KROK 4). Rekomendacja: opcja (b) dla runtime, opcja walidacji w CI/teście jako jedyny faktyczny gate.

**Faza 3 (opcjonalna, "can wait")— Dodać krok build-time.**
Skrypt Node wywoływany jako `"prebuild"` w `package.json`, który uruchamia tę samą walidację i przerywa `npm run build` z niezerowym kodem wyjścia, jeśli `checkIntegrity` zwróci niepustą listę. To jest analogiczne do już istniejącego wzorca w tym repo (`npx astro sync` przed `lint`/`test`/`build` w `.github/workflows/ci.yml`).

**Faza 4 (opcjonalna, wykraczająca poza zakres inwariantu A, ale naturalne rozszerzenie)** — refaktoryzacja typu `Stage` na discriminated union (`{ kind: "leaf"; documents: Document[] } | { kind: "branch"; subTypes: SubType[] }`), żeby inwariant D był wymuszony **w typie**, nie tylko w runtime-owym `walkStage`. To jest głębsza zmiana (wymaga migracji `tree.ts` i `Wizard.tsx`), więc nazwana tu jako możliwy krok następny, nie część tego planu.

### Nowe "nazwy noszące ciężar" (load-bearing names) — rejestr kontraktów

**W tym repozytorium nie istnieje dzisiaj żaden rejestr kontraktów / "rejestr load-bearing names"**. Zweryfikowano: `context/` zawiera wyłącznie katalogi `foundation/`, `architecture/`, `domain/`, `changes/` — żaden plik o nazwie zawierającej "contract" lub "rejestr" nie istnieje (`find context -iname "*contract*"` i `*rejestr*` → brak wyników). CLAUDE.md projektu 10xDevs (`/Users/zenobia.gawlikowska/Development/CLAUDE.md`) wspomina `docs/reference/contract-surfaces.md` jako artefakt innego projektu/lekcji — nie jest to plik istniejący w `asystent-lokatorski`. Zgodnie z instrukcją zadania: **nie wynajduję tu takiego rejestru**. Gdyby taki rejestr istniał, poniższe nazwy byłyby kandydatami do wpisania (wymienione informacyjnie, nie jako wpis do nieistniejącego pliku):
- `DecisionTreeCatalog` (agregat)
- `DecisionTreeIntegrityError` (błąd domenowy)
- `TreeIntegrityViolation` (typ discriminowany naruszeń)
- `DecisionTreeCatalogRepository` / `StaticFileSystemCatalogRepository`

---

## Podsumowanie

Wybrany inwariant #1 to **Inwariant A** (każdy osiągalny węzeł terminalny prowadzi do co najmniej jednego `Document`, każdy `Document.filename` wskazuje na plik istniejący pod `public/documents/warszawa/`) — wybrany dlatego, że jest jednocześnie najbardziej rdzenny dla definicji sukcesu produktu (`prd.md:26`) i najsłabiej wymuszony (zero mechanizmów: brak w typie, brak w CI, brak w testach, brak w build). Weryfikacja własna potwierdziła: **12/12 unikalnych `filename` z `tree.ts` istnieje na dysku w chwili pisania tego dokumentu** (stan zgodny z twierdzeniem poprzedniego przebiegu), oraz **`tests/wizard-state.test.ts` faktycznie nigdy nie importuje `src/data/tree.ts`** — używa wyłącznie ręcznego fixture (`tests/wizard-state.test.ts:132-181`), co potwierdza, że drzewo produkcyjne jest dziś zerowo testowane. Projekt agregatu `DecisionTreeCatalog` z prywatnym konstruktorem i metodą `create()` rzucającą `DecisionTreeIntegrityError` przenosi wymuszenie z "cichego fallbacku w UI + 404 w przeglądarce tenanta" na "błąd zatrzymujący build/CI, zanim kod trafi na produkcję" — co jest uczciwym odpowiednikiem "przenieś enforcement na serwer" w aplikacji, która serwera domenowego nie ma.
