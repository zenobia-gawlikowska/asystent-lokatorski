---
title: Domain Distillation — Asystent Lokatorski
created: 2026-07-09
type: domain-distillation
---

# Destylacja domeny — Asystent Lokatorski

Metodologia: KROK 0–5, zgodnie z wymaganym przebiegiem (discovery → analiza → klasyfikacja). Każde twierdzenie faktograficzne jest opatrzone cytatem `plik:linia` zweryfikowanym osobiście poprzez odczyt pliku — żaden numer linii nie jest przepisany bez sprawdzenia. Tam, gdzie coś faktycznie nie istnieje w kodzie, napisano to explicite jako **BRAK w kodzie**.

Pliki źródłowe odczytane w całości w tej sesji: `src/data/tree.ts` (835 linii), `src/data/types.ts` (79 linii), `src/lib/wizard-state.ts` (72 linie), `src/components/Wizard.tsx` (335 linii), `tests/wizard-state.test.ts` (246 linii). Dokumenty pomocnicze odczytane i zweryfikowane, nie tylko streszczone: `context/foundation/prd.md`, `context/architecture/repo-map.md`, `context/architecture/refactoring-plan.md`, `context/domain/ubiquitous-language.md`, `context/domain/bounded-contexts.md`.

---

## KROK 0 — Kontekst projektu

**Dokumenty fundamentu — potwierdzone istnienie:**

- `context/foundation/prd.md` (150 linii) — pełny PRD z wizją, personą, kryteriami sukcesu, historyjkami użytkownika (US-01…US-08), wymaganiami funkcjonalnymi (FR-001…FR-008), wymaganiami niefunkcjonalnymi (NFR-A11Y-01, NFR-PERF-01, NFR-PRIV-01), logiką biznesową, modelem danych, kontrolą dostępu, strategią testowania, strategią deploymentu i pytaniami otwartymi. Frontmatter: `product_type: web-app`, `status: draft` (`prd.md:2,5`).
- `context/foundation/tech-stack.md` — istnieje (potwierdzone `ls`), przywołany w `prd.md:134` jako artefakt bootstrappera, traktowany jako read-only.
- `context/architecture/repo-map.md` i `context/architecture/refactoring-plan.md` — istnieją, dostarczają mapę pliku po pliku oraz listę znanych problemów (w tym pkt 3 dotyczący duplikacji w `tree.ts`, re-zweryfikowany niezależnie w KROK 1/3/4 poniżej).
- `context/domain/ubiquitous-language.md` i `context/domain/bounded-contexts.md` — istnieją, wcześniejsza ekstrakcja słownika domenowego i kontekstów ograniczonych; niniejszy dokument buduje na nich, ale weryfikuje każdy cytat od nowa i ma inną wymaganą strukturę (macierz KROK, nie prosa).

**Stack i warstwy (zweryfikowane odczytem kodu):**

- Brak logiki serwerowej związanej z domeną: `src/pages/index.astro` jest jedyną trasą (`repo-map.md:53-54`), owija `<Wizard client:load />`. Astro działa w trybie `output: "server"`, ale wyłącznie dlatego, że adapter Cloudflare (`@astrojs/cloudflare`) wymaga wyjścia SSR — nie istnieje żadna trasa `/api/*` obsługująca logikę domenową (`prd.md:92`).
- Jedna wyspa React: `src/components/Wizard.tsx` — zweryfikowane odczytem, plik ma 335 linii treści (domknięcie funkcji `Wizard()` w linii 335, plik kończy się linią 336). Komponent `Wizard()` zaczyna się `Wizard.tsx:95`.
- `src/data/tree.ts` (835 linii, zweryfikowane odczytem — ostatnia linia to `];` na linii 835) jest jedynym miejscem, gdzie żyje treść merytoryczna (drzewo decyzyjne). Potwierdza to komentarz `tree.ts:3-5`: "Seed data for MVP... Translations marked [TODO] need native-speaker review before going live" — sygnał, że treść jest traktowana jako dane konfiguracyjne, nie kod.
- Warstwa czystych funkcji: `src/lib/wizard-state.ts` (72 linie, zweryfikowane odczytem — plik kończy się linią 72), oddzielona od `Wizard.tsx` właśnie po to, by była testowalna bez DOM — potwierdzone komentarzem `wizard-state.ts:47`: "Replicates the inline derivation from Wizard.tsx — pure, no side-effects".

Wniosek KROK 0: to nie jest architektura wielowarstwowa w klasycznym sensie DDD (nie ma oddzielnych pakietów warstwy aplikacji/domeny/infrastruktury) — cała domena mieści się w jednym pliku danych (`tree.ts`) i jednym module czystych funkcji (`wizard-state.ts`), otoczonych jedną wyspą UI (`Wizard.tsx`). Ma to znaczenie dla KROK 3/5: "agregaty", jeśli istnieją, istnieją tylko jako kształt typów w `types.ts`, nie jako klasy z zamkniętym zachowaniem.

---

## KROK 1 — Ubiquitous Language (Wspólny Język)

Dla każdego pojęcia: definicja, cytat źródłowy (dokument), miejsce w kodzie (`plik:linia`) lub **BRAK w kodzie**.

### 1.1 Encje strukturalne

| Pojęcie | Definicja | Źródło (dokument) | Miejsce w kodzie |
|---|---|---|---|
| **City** | Miasto — węzeł najwyższego poziomu drzewa; obecnie tylko `warszawa` zasiane. | `prd.md:106-109` | Typ: `types.ts:61-66`. Dane: `tree.ts:9` (`id: "warszawa"`). |
| **CaseType** | Typ sprawy — sytuacja, z którą lokator się samoidentyfikuje na pierwszym ekranie. 5 instancji. | `ubiquitous-language.md:5-14` | Typ: `types.ts:52-59`. Dane: `tree.ts:13,312,409,569,737` (5 wystąpień: `wypowiedzenie`, `podwyzka-czynszu`, `zaniedbanie-napraw`, `dzika-eksmisja`, `odmowa-lokalu`). |
| **Stage** | Etap — "w którym miejscu jesteś" w ramach danego CaseType. Węzeł liścia (ma `documents`) albo węzeł rozgałęzienia (ma `subTypes`) — zgodnie z komentarzem typu, nigdy oba naraz. | `types.ts:47` (komentarz: "Either documents (terminal) or subTypes (one more level of navigation)") | Typ: `types.ts:44-50`. Zweryfikowano ręcznie wszystkie 15 obiektów Stage w `tree.ts` — żaden nie ma jednocześnie obu pól. Reguła jest deklarowana w typie, ale **nie jest wymuszana przez system typów** (`documents?`/`subTypes?` są niezależnymi opcjonalnymi polami). Zob. KROK 3, I-1. |
| **SubType** | Podtyp — dodatkowy poziom rozwidlenia używany tylko wtedy, gdy Stage wymaga dalszego wyboru przed dotarciem do wyniku. | `ubiquitous-language.md:45` | Typ: `types.ts:37-42`. Dane: 4 wystąpienia w `tree.ts` — `dzika-eksmisja-sub` (`tree.ts:85`), `pozew-o-eksmisje` (`tree.ts:253`), `lokal-komunalny` (`tree.ts:439`), `lokal-prywatny` (`tree.ts:502`). |
| **Document** | Węzeł terminalny — rzeczywisty plik PDF KOPL plus metadane (`documentType`, `name`, opcjonalny `description`/`note`, `filename`). | `ubiquitous-language.md:46` | Typ: `types.ts:24-35`. 16 wystąpień pola `filename` w `tree.ts` (policzone `grep -n 'filename:'`), wskazujących na 12 unikalnych plików fizycznych w `public/documents/warszawa/` (zweryfikowane `ls`, 12 plików). |
| **DecisionTree** | Alias typu `City[]` — całe drzewo. | `prd.md:106` | `types.ts:68`. |
| **Step** | Stan nawigacji wizarda — unia dyskryminowana po `id`: `caseType`/`stage`/`subType`/`subStage`/`result`. | `prd.md:82` (FR-003) | `types.ts:74-79`. |

### 1.2 Operacje (funkcje czyste)

| Pojęcie | Definicja | Miejsce w kodzie |
|---|---|---|
| **appendStep** | Dopisuje nowy `Step` na koniec historii, niemutująco. | `wizard-state.ts:24-26` |
| **popStep** | Usuwa ostatni `Step`, z osłoną: przy 1-elementowej historii nie robi nic. | `wizard-state.ts:29-31` |
| **resetSteps** | Zwraca nową jednoelementową historię `[{id:"caseType"}]`. | `wizard-state.ts:33-35` |
| **deriveWizardNodes** | Czysta funkcja: `(Step, City?) → WizardNodes`. Przechodzi drzewo i zwraca dopasowane węzły `caseType/stage/subType/subStage/resultStage`, albo `undefined` na każdym poziomie, gdzie ID się nie zgadza. | `wizard-state.ts:48-72` |
| **stepCount / stepNumber** | Pomocnicze funkcje UI do progress-bara — rozróżniają ścieżkę 3-krokową od 5-krokowej. | `wizard-state.ts:7-20` |

### 1.3 Stany / reguły domenowe

| Pojęcie | Definicja | Źródło (dokument) | Miejsce w kodzie / status |
|---|---|---|---|
| **Ścieżka standardowa (3 kroki)** | `caseType → stage → result`, gdy `stage.subTypes` jest puste/nieobecne. | `prd.md:41-43` (US-02) | `Wizard.tsx:220-225` (rozgałęzienie `if (s.subTypes?.length) ... else go({id:"result"...})`) |
| **Ścieżka rozszerzona (5 kroków)** | `caseType → stage → subType → subStage → result`, gdy `stage.subTypes` istnieje. | `prd.md:45-48` (US-03) | `Wizard.tsx:220-222` + `wizard-state.ts:8-9` |
| **Klasyfikator bez ważenia** | "each path through the tree resolves to exactly one resultStage" — dokładne dopasowanie ID, brak fuzzy matching, brak scoringu. | `prd.md:97-99` (Business logic) | `wizard-state.ts:69`: `resultStage = step.id === "result" ? (subStage ?? stage) : undefined` — dosłownie zwraca jeden obiekt, nigdy listę kandydatów. |
| **DocumentType (adresat)** | Taksonomia adresata/instancji: `letter` (właściciel/zarządca), `court` (sąd), `police` (policja/prokuratura). Nie opisuje formatu dokumentu — opisuje odbiorcę. | `ubiquitous-language.md:26-34` | `types.ts:19-22` |
| **FR-001 (opis rozpoznawczy)** | Każdy CaseType ma dłuższy `description` pomagający lokatorowi rozpoznać swoją sytuację. | `prd.md:80` | Komentarz w kodzie: `types.ts:56` — `// Longer description that helps the tenant recognize their situation (FR-001)` |
| **FR-002 ("furtka" kontaktu z KOPL)** | Zawsze widoczny link kontaktowy do KOPL, niezależny od stanu wizarda. | `prd.md:81` | Komentarz w kodzie: `Wizard.tsx:320` — `{/* Contact staff escape — FR-002, always visible */}`; render bezwarunkowy `Wizard.tsx:321-330`, poza wszystkimi blokami `step.id === ...`. |
| **Persystencja języka** | Wybór języka zapisywany w `localStorage["kopl-lang"]`, czytany w `useEffect` przy montowaniu (unikanie mismatch SSR/hydration). | `prd.md:63-64` (US-06) | `Wizard.tsx:106-113` (odczyt), `Wizard.tsx:115-119` (`changeLang`, zapis) |
| **CITY_ID hardkodowany** | Miasto na trwałe ustawione na `"warszawa"`, krok wyboru miasta usunięty. | `prd.md:85` (FR-006) | `Wizard.tsx:39`: `const CITY_ID = "warszawa"` |
| **String `selectCity` wciąż istnieje w UI, ale jest martwy** | — | **BRAK w kodzie jako żywa funkcjonalność.** `ui.ts:4-11` definiuje klucz `selectCity: {...}` (tekst "Wybierz swoje miasto" we wszystkich 6 językach), ale `grep -rn "selectCity" src/` zwraca wyłącznie tę jedną definicję — nigdzie w `Wizard.tsx` ani gdziekolwiek indziej nie jest odczytywany. Osierocony po usunięciu ekranu wyboru miasta (commit `e7c7c40`, cytowany w `prd.md:85`). Ten fakt nie był wcześniej odnotowany w `ubiquitous-language.md` ani `repo-map.md`. |
| **Eligibility (uprawnienie)** | Kalkulacja czy lokator kwalifikuje się do lokalu komunalnego wg progu dochodowego. | `bounded-contexts.md:25-36`, `context/changes/personalizacja-eligibility/research.md` | **BRAK w kodzie.** Zbadane, niezbudowane — potwierdzone: brak pliku `eligibility-criteria.ts` czy podobnego w `src/data/` (jedyne pliki: `tree.ts`, `types.ts`, `ui.ts`). |
| **Personalizacja dokumentu** | Generowanie dokumentu wypełnionego danymi konkretnego lokatora, odróżnione od pobrania statycznego szablonu. | `prd.md:139` (Non-goals) | **BRAK w kodzie.** Żaden plik PDF w `public/documents/warszawa/` nie ma pól AcroForm (ustalenie z `context/changes/personalizacja-eligibility/research.md`, dotyczy struktury plików binarnych PDF — przyjęte jako wiarygodny wynik poprzedniego badania, nie re-weryfikowane binarnie w tej sesji). |
| **Kontrola dostępu / logowanie** | — | `prd.md:113-121` (Access control) | **BRAK w kodzie, zamierzenie projektowe.** Brak jakiegokolwiek routingu chronionego, sesji, roli. Potwierdzone brakiem plików `src/pages/auth/`, `src/middleware.ts` w rzeczywistym drzewie `src/` — `refactoring-plan.md:9` już to nazywa, cytując bezpośrednio wynik `find src -type f`. |

---

## KROK 2 — Klasyfikacja poddomen: Core / Supporting / Generic

| Obszar / pojęcie | Klasyfikacja | Uzasadnienie względem `prd.md` (wizja / kryteria sukcesu / non-goals) |
|---|---|---|
| **Drzewo decyzyjne (`CaseType→Stage→SubType?→Document`), `tree.ts`** | **Core** | To *jest* produkt — wizja mówi dosłownie: "the wizard's only job is to compress that triage into 3–5 tile taps" (`prd.md:16`). Kryterium sukcesu #1: "3–5 taps... no form fields" (`prd.md:26`). Cała wartość biznesowa (dobór właściwego dokumentu prawnego) jest zakodowana w treści tego drzewa, nie w mechanizmie nawigacji. |
| **Klasyfikator/routing (`deriveWizardNodes`, `Step`, historia jako stos)** | **Core** (mechanizm wspierający treść Core) | `prd.md:97-99`: "the case-routing decision tree is the business logic". Bez poprawnej, deterministycznej nawigacji odwzorowanie odpowiedzi na dokument by się rozpadło — ale to treść drzewa niesie wartość, mechanizm jest wehikułem. |
| **DocumentType (badge adresata: letter/court/police)** | **Supporting** | Nie jest to sama wartość produktu, ale wzmacnia zdolność lokatora do zrozumienia dokumentu przed pobraniem — FR-004 (`prd.md:83`) explicite wiąże to z celem "tenant can tell at a glance whether a document goes to their landlord, a court, or the police". Wspiera Core, nie jest nim samym. |
| **Lokalizacja UI (6 języków, `LocalizedString`, `ui.ts`)** | **Supporting** | Kryterium sukcesu #2 (`prd.md:27`) czyni to wymaganiem produktowym, ale sama mechanika i18n (mapa string→string) jest generycznym problemem inżynieryjnym — wartość jest w *treści* tłumaczeń (dane Core-adjacent), nie w mechanizmie przełącznika języka. |
| **FR-002 / "furtka" kontaktu z KOPL** | **Supporting** | Bezpośrednio wynika z persony ("stressed, time-pressured") i wizji — jest siecią bezpieczeństwa dla przypadków poza zasięgiem drzewa, ale nie jest samym rdzeniem klasyfikacji. |
| **Historia nawigacji jako stos (`back`/`reset`)** | **Generic** | To standardowy wzorzec UI (wizard pattern, back/forward stack) — nie ma nic specyficznie prawnego/lokatorskiego w `appendStep`/`popStep`/`resetSteps`. Mógłby być identyczny w dowolnym wielokrokowym formularzu. |
| **Persystencja preferencji językowej (`localStorage`)** | **Generic** | Standardowy wzorzec zapisu preferencji UI, niespecyficzny domenowo. |
| **Pobieranie statycznego PDF (`<a href download>`)** | **Generic** | Zwykły mechanizm przeglądarki — brak logiki serwerowej, brak generowania. |
| **Dostępność (a11y: ARIA, focus rings, axe-core dev)** | **Supporting** | NFR-A11Y-01 (`prd.md:91`) — realna inwestycja inżynieryjna, ale nie odróżnia produktu merytorycznie; wspiera dotarcie do tej samej wartości (Core) przez większą grupę użytkowników. |
| **Eligibility (kalkulacja progu dochodowego)** | **Core, jeśli powstanie** — obecnie **BRAK w kodzie** | `bounded-contexts.md:25-36` argumentuje słusznie, że to inny rodzaj obliczenia (numeryczne, nie treściowe), ale merytorycznie odpowiadałoby na to samo pytanie rdzenia produktu ("czy i jaki dokument/decyzja pasuje do mojej sytuacji") — więc klasyfikacja docelowa to Core, nie Supporting. Niezbudowane — `prd.md:140` (Non-goals). |
| **Personalizacja dokumentu (generowanie PDF z danymi tenanta)** | **Supporting, jeśli powstanie** — obecnie **BRAK w kodzie** | Nie zmienia *którą* sprawę/dokument dostaje lokator (to wciąż rdzeń klasyfikatora) — zmienia tylko *format dostawy* tego samego dokumentu. `prd.md:139` klasyfikuje to jako non-goal, zbadane i odrzucone jako "over-engineered" na MVP. |

---

## KROK 3 — Kandydaci na agregaty i ich inwarianty

Ponieważ w tym kodzie nie istnieją klasy domenowe z zamkniętym zachowaniem (wszystko to płaskie interfejsy TypeScript + funkcje czyste operujące na nich z zewnątrz), "agregat" należy rozumieć tutaj jako **grupę danych, która powinna być utrzymywana w spójności jako jedność** — zgodnie z duchem DDD, nie jego literą (brak faktycznych klas/encji z metodami).

| Kandydat na agregat | Inwariant (co MUSI być zawsze prawdą) | Status w kodzie |
|---|---|---|
| **I-1: Stage — "liść XOR rozgałęzienie"** | Stage ma `documents` **albo** `subTypes`, nigdy oba, nigdy żadne. | **Deklarowane komentarzem, nieegzekwowane przez typy.** Komentarz: `types.ts:47`. Weryfikacja ręczna wszystkich 15 obiektów Stage w `tree.ts` pokazuje, że reguła **jest faktycznie zachowana w danych dzisiaj**, ale system typów (`documents?: Document[]; subTypes?: SubType[]` jako dwa niezależne pola opcjonalne, `types.ts:48-49`) nie wymusiłby tego przy błędnym dodaniu nowego Stage z oboma polami — kompilator by to zaakceptował. Ryzyko: **zignorowane strukturalnie, egzekwowane tylko przez konwencję i przegląd kodu.** |
| **I-2: resultStage rozwiązuje się do dokładnie jednego Stage** | Dla dowolnego pełnego `Step` typu `result`, `deriveWizardNodes` zwraca ≤1 `resultStage` (nigdy listę kandydatów, nigdy sprzeczność). | **Egzekwowane kodem.** `wizard-state.ts:69`: `resultStage = step.id === "result" ? (subStage ?? stage) : undefined` — strukturalnie może zwrócić tylko jeden obiekt. Pokryte testem: `tests/wizard-state.test.ts:201-213` (standardowa ścieżka) i `215-233` (ścieżka rozszerzona), łącznie z asercją `resultStage === stage`/`resultStage === subStage` (referencyjna tożsamość). |
| **I-3: każdy osiągalny węzeł terminalny (Stage bez subTypes) ma ≥1 Document** | Żaden Stage-liść nie powinien być pusty — inaczej lokator dotarłby do ekranu wyniku bez dokumentu do pobrania. | **Zweryfikowane ręcznie w tej sesji, egzekwowane tylko przez ręczną autorską dyscyplinę, nie przez kod.** Sprawdzono wszystkie 15 obiektów Stage w `tree.ts` (terminalne, tj. bez `subTypes`: `otrzymalem-wypowiedzenie` L32, `bezprawne-odciecie-mediow-sub` L104, `najscie-w-lokalu-sub` L175, `postepowanie-umorzone-sub` L217, `otrzymalem-pozew-eksmisja` L272, `zawiadomienie-o-podwyzce` L331, `podwyzka-bez-pisma` L373, `obnizka-komunalna` L458, `obnizka-prywatna` L521, `bezprawne-odciecie-mediow` L588, `najscie-w-lokalu` L659, `postepowanie-umorzone` L701, `skarga-uchwaly` L756, `prawo-do-lokalu-po-rodzicach` L790): każdy ma niepuste `documents` (min. 1, maks. 2 — np. `bezprawne-odciecie-mediow` ma 2 dokumenty, `tree.ts:588-657`). Renderer w `Wizard.tsx:286` używa `(resultStage.documents ?? [])` — kod jest defensywny wobec pustej/undefined listy (renderowałby po prostu 0 kart, bez błędu), ale nic nie ostrzega autora treści, że taki Stage byłby "martwy". **Brak automatycznego testu integralności danych** — potwierdza to `refactoring-plan.md:51` i `prd.md:127` (Coverage gap). |
| **I-4: Document.filename wskazuje na istniejący plik** | Każdy `filename` musi rozwiązywać się do rzeczywistego pliku pod `public/documents/warszawa/`. | **Zweryfikowane w tej sesji, poprawnie zachowane, ale niewymuszone kodem.** `grep -n 'filename:' src/data/tree.ts` zwraca 16 wystąpień, wskazujących na 12 unikalnych nazw plików; `ls public/documents/warszawa/` zwraca dokładnie te same 12 plików. **Brak plików osieroconych i brak referencji do nieistniejących plików — zgodność 1:1 potwierdzona.** Nic w budowie (`npm run build`) czy CI (`prd.md:132`) tego nie sprawdza automatycznie — potwierdza `repo-map.md:100`. Ryzyko: **zgodne dziś, ale ignorowane strukturalnie.** |
| **I-5: LocalizedString ma wszystkie 6 kluczy Lang niepuste** | Każdy string widoczny dla użytkownika musi mieć wypełnione `pl/ua/ru/en/es/fr`. | **Egzekwowane częściowo przez typ (obecność klucza — tak, przez `Record<Lang, string>`), NIE egzekwowane co do niepustości wartości.** Typ w `types.ts:16`: `Record<Lang, string>` — `string` akceptuje `""` jako wartość poprawną. `tree.ts:5` ostrzega: "Translations marked [TODO] need native-speaker review before going live" — autorzy sami sygnalizują niepewność co do kompletności treściowej. Testy jednostkowe (`tests/wizard-state.test.ts:134,139,147...`) wprost używają fixture'ów z pustymi stringami (`ua: "", ru: "", ...`) jako wartości dopuszczalnych przez typ — co potwierdza, że puste stringi są legalne strukturalnie, tylko niepożądane treściowo. |
| **I-6: historia (Step[]) nigdy nie jest pusta** | `history.length >= 1` zawsze. | **Egzekwowane kodem i testem.** `popStep` (`wizard-state.ts:29-31`) ma osłonę `history.length > 1 ? ... : history`. Inicjalizacja: `Wizard.tsx:97` — `useState<Step[]>([{ id: "caseType" }])`. Test: `tests/wizard-state.test.ts:96-100`. **Jedyny inwariant w tym repo z pełnym pokryciem: deklaracja w kodzie + wymuszenie logiczne + test regresyjny.** |
| **I-7: dokładnie jedno City jest aktywne (`CITY_ID`)** | System zawsze operuje na jednym, ustalonym mieście. | **Wymuszone kodem, ale przez stałą, nie przez model danych.** `Wizard.tsx:39`: `const CITY_ID = "warszawa"`; `Wizard.tsx:103`: `city = tree.find((c) => c.id === CITY_ID)`. Model danych (`DecisionTree = City[]`) strukturalnie zezwala na wiele miast — inwariant "tylko jedno miasto" żyje wyłącznie jako literał stringa w komponencie UI, nie w typach czy danych. |

---

## KROK 4 — Lista rozjazdów MODEL vs KOD (Model vs Code drift)

| # | Dokument mówi X | Kod robi Y | Dowód (`plik:linia`) |
|---|---|---|---|
| **D-1** | `prd.md:109` i `ubiquitous-language.md:39` opisują strukturę jako czystą hierarchię `City → CaseType → Stage → (SubType → Stage)? → Document` — implikując pojedynczą, nieduplikowaną ścieżkę do każdego węzła. | W rzeczywistości drzewo zawiera **dwie kopie tej samej podgałęzi** osiągalnej z dwóch różnych rodziców: `wypowiedzenie → termin-minal → dzika-eksmisja-sub` (3 Stage, 4 Document) jest bajt-w-bajt identyczne z samodzielnym CaseType `dzika-eksmisja` (3 Stage, 4 Document) — inny `id` węzła nadrzędnego, identyczna treść potomna (te same etykiety wielojęzyczne, te same `filename`). | `tree.ts:85-251` (`dzika-eksmisja-sub` jako SubType: otwiera się L85, zamyka L251 — przed sąsiadującym SubType `pozew-o-eksmisje` L253-307, który NIE jest częścią duplikacji), zawiera `bezprawne-odciecie-mediow-sub` (L104-173), `najscie-w-lokalu-sub` (L175-215), `postepowanie-umorzone-sub` (L217-249) — vs. `tree.ts:569-735` (samodzielny CaseType `dzika-eksmisja`: otwiera się L569, zamyka L735), zawiera `bezprawne-odciecie-mediow` (L588-657), `najscie-w-lokalu` (L659-699), `postepowanie-umorzone` (L701-734). Porównanie treści linia-po-linii (np. `tree.ts:104-172` vs `tree.ts:588-656`) wykazuje identyczne stringi we wszystkich 6 językach i identyczne `filename`. Potwierdzone również git-archeologią: `git log --oneline -- src/data/tree.ts` pokazuje `65afb89` ("feat(tree): add dzika-eksmisja case type with 3 stages and documents") jako starszy commit, `8d7bf64` ("feat(tree): add subType navigation level; redirect termin-minal to eksmisja subtree") jako późniejszy — ten drugi commit stworzył duplikat pod `termin-minal`. |
| **D-2** | `ubiquitous-language.md:12` opisuje `dzika-eksmisja` jako "Consolidated with what used to be a separate `odciecie-mediow` case type — commit `4c49cd0` folded utility cutoff into this one as a stage" — sugerując zakończoną konsolidację, jeden kanoniczny dom dla tej treści. | Konsolidacja `4c49cd0` ("refactor(tree): consolidate odciecie-mediow into dzika-eksmisja", zweryfikowana `git show --stat 4c49cd0`: usunęła samodzielny case type `odciecie-mediow`, scaliła go w `dzika-eksmisja`) faktycznie się wydarzyła — ale późniejszy commit `8d7bf64` osobno **odtworzył tę samą treść jeszcze raz** pod `wypowiedzenie → termin-minal`, tworząc drugi dom zamiast jednego kanonicznego. Narracja "skonsolidowano" jest więc tylko połowicznie prawdziwa. | `git log --oneline -- src/data/tree.ts`: `4c49cd0` chronologicznie przed `8d7bf64`; treść `tree.ts:85-251` (`8d7bf64`-owy duplikat) współistnieje dziś w tym samym pliku z `tree.ts:569-735` (`dzika-eksmisja` post-`4c49cd0`). |
| **D-3** | `refactoring-plan.md:31` rekomenduje: "extract the duplicated... stages into a single shared constant referenced from both `wypowiedzenie`'s subtree and the standalone `dzika-eksmisja` case type" — sformułowane jako rekomendacja na przyszłość ("can wait"). | Kod dzisiaj **nie ma żadnego mechanizmu współdzielenia fragmentów** — `tree.ts` to jeden literał obiektowy bez importów pomocniczych czy referencji między węzłami; nie istnieje żaden plik `shared-stages.ts` czy podobny. | Potwierdzone brakiem takiego pliku w `src/data/` (jedyne pliki: `tree.ts`, `types.ts`, `ui.ts`). |
| **D-4** | `types.ts:47` deklaruje komentarzem: "Either documents (terminal) or subTypes (one more level of navigation)" — sformułowane jako reguła obowiązująca. | System typów **nie wymusza** tej reguły — `documents?` i `subTypes?` (`types.ts:48-49`) są dwoma niezależnymi opcjonalnymi polami; nic nie broni obiektowi Stage posiadania obu pól lub żadnego z nich. Reguła jest zachowywana dziś tylko przez dyscyplinę autorską (zweryfikowane manualnie dla wszystkich 15 realnych Stage). | `types.ts:44-50` (deklaracja typu) vs. brak jakiegokolwiek discriminated union / mapped type, który by to wymusił. |
| **D-5** | `prd.md:127` i `refactoring-plan.md:51` stwierdzają otwarcie: "no test coverage of `src/data/tree.ts`'s actual content (e.g., no automated check that every Stage/SubType node terminates in at least one Document, or that every referenced filename exists...)" — deklarowane jako znana, nazwana luka. | Zgodne z kodem — potwierdzone w tej sesji: `tests/wizard-state.test.ts` (246 linii, zweryfikowane odczytem) testuje wyłącznie funkcje z `wizard-state.ts` na fixture'ach syntetycznych (`CITY`, `CASE_TYPE`, `STAGE_PLAIN` etc., linie 132-181), nigdy na rzeczywistym imporcie `tree` z `src/data/tree.ts`. | `tests/wizard-state.test.ts:1-4` (importy: `@/data/types`, `@/lib/wizard-state` — nie `@/data/tree`). Ta rozbieżność jest już poprawnie i celowo nazwana w dokumentacji — nie jest to nowo odkryty rozjazd, ale potwierdzony jako wciąż aktualny. |
| **D-6** | `prd.md:85` (FR-006) stwierdza: "the former city-selection step was deliberately removed" — implikując, że wszystkie artefakty związane z wyborem miasta zostały usunięte. | String UI `selectCity` (`ui.ts:4-11`, treść "Wybierz swoje miasto" w 6 językach) **wciąż istnieje w kodzie**, mimo że krok UI, który by go użył, został usunięty. Osierocony, potwierdzony przez `grep -rn "selectCity" src/` zwracający wyłącznie definicję, zero użyć. Nie wpływa na zachowanie (string nieużywany nie renderuje się), ale jest to martwy kod, którego nie odnotował dotąd żaden z istniejących dokumentów kontekstowych. | `ui.ts:4-11` (definicja) vs. brak wystąpień poza definicją. |
| **D-7** | `ubiquitous-language.md:44` opisuje Stage jako mający "*never both*" `documents`/`subTypes` — analogicznie do D-4, ale formułuje to jako fakt o kodzie, nie tylko o komentarzu w typie. | Zgodne z rzeczywistymi danymi dziś (zweryfikowano wszystkie 15 Stage), ale — jak w D-4 — nieprawda, że kod to *wymusza*; prawda jest tylko, że dane *aktualnie* to respektują. Rozjazd nie jest w faktach, lecz w sile modalnej twierdzenia. | `types.ts:44-50` (brak wymuszenia) + manualna weryfikacja `tree.ts`. |

---

## KROK 5 — Ranking refaktoryzacji

Kryteria: **wartość** (jak bardzo inwariant/obszar jest core wobec celu produktu — z KROK 2) × **ryzyko** (jak słabo jest dziś wymuszony — z KROK 3).

| Ranking | Kandydat | Wartość (core-ness) | Ryzyko (siła wymuszenia dziś) | Uzasadnienie |
|---|---|---|---|---|
| **#1** | **Deduplikacja podgałęzi `dzika-eksmisja-sub` / `dzika-eksmisja`** (D-1/D-2/D-3) | **Wysoka** — to jest treść drzewa decyzyjnego, czyli sam Core produktu (`prd.md:97-99`). Błąd w treści prawnej (np. przestarzały artykuł kk, zmieniony termin ustawowy) musiałby dziś być poprawiony **w dwóch miejscach** (`tree.ts:104-172` i `tree.ts:588-656` dla węzła "odcięcie mediów", analogicznie dla dwóch pozostałych par) — nic w kodzie, testach czy CI nie ostrzega, jeśli poprawiono tylko jedno z nich. | **Najwyższe z całej listy** — nie istnieje żaden mechanizm wspólnego fragmentu (D-3); duplikacja jest strukturalna (dwa niezależne literały obiektowe), nie referencyjna. |
| (dla porównania) | Inwarianty I-6 (historia nigdy pusta) i I-2 (resultStage jednoznaczny) | Wysoka | Niskie — już w pełni wymuszone i przetestowane | Niski priorytet refaktoryzacji — dobrze zrobione już dziś. |
| (dla porównania) | I-3/I-4 (kompletność drzewa: każdy liść ma dokument, każdy filename istnieje na dysku) | Wysoka | Wysokie w teorii (brak automatycznej walidacji), ale w tej sesji zweryfikowano **0 rozjazdów** w danych dzisiejszych | Niższa pilność niż duplikacja, bo problem jest potencjalny (regresja przyszła), nie aktywny dziś. |
| (dla porównania) | I-5 (kompletność tłumaczeń) | Supporting, nie Core (z KROK 2) | Słabe wymuszenie, ale dokument sam przyznaje niedokończony stan ("[TODO]", `tree.ts:5`) | Ryzyko znane i zaakceptowane, nie skrywane — niższy priorytet. |

### #1 kandydat do refaktoryzacji: deduplikacja `dzika-eksmisja-sub` / `dzika-eksmisja`

**Dlaczego to jest zwycięzca rankingu:**

1. **To już się materializuje jako koszt, nie tylko ryzyko teoretyczne.** Commit `4c49cd0` ("consolidate odciecie-mediow into dzika-eksmisja") pokazuje, że autorzy *już raz* próbowali skonsolidować tę treść — a kolejny commit (`8d7bf64`) *odtworzył* duplikat w innym miejscu drzewa. To wzorzec, który się powtórzy przy kolejnej zmianie treści prawnej, jeśli struktura się nie zmieni.
2. **Dotyka rdzenia produktu, nie peryferii.** To nie jest duplikat w kodzie UI czy w testach — to duplikat w *samej treści prawnej*, którą KOPL autoryzuje i za którą odpowiada merytorycznie. Rozjazd między dwiema kopiami (np. jedna zaktualizowana, druga nie) oznaczałby, że lokator otrzymuje różną odpowiedź w zależności od tego, *jak* dotarł do tego samego węzła merytorycznego — co jest realnym błędem triage, nie kosmetycznym.
3. **Rekomendacja naprawy już istnieje i jest skonkretyzowana** (`refactoring-plan.md:31`): wydzielić `bezprawne-odciecie-mediow`/`najscie-w-lokalu`/`postepowanie-umorzone` jako współdzielone stałe importowane z dwóch miejsc, zamiast dwóch literałów.
4. **Niska bariera wejścia względem korzyści.** To nie wymaga migracji danych ani zmiany API/kontraktu — tylko przeniesienia trzech obiektów `Stage` do stałej i dwóch referencji w miejsce dwóch kopii. Ryzyko regresji jest niskie właśnie dlatego, że drzewo jest czystymi danymi statycznymi bez efektów bocznych.

**Uwaga metodologiczna — korekta precyzji cytatu:** poprzednia analiza (`refactoring-plan.md:27` oraz zadanie tej sesji) podała zakres `dzika-eksmisja-sub` jako "~84–307". W tej sesji zweryfikowano dokładnie: `dzika-eksmisja-sub` jako **SubType** otwiera się na `tree.ts:85` (pole `id`, blok SubType zaczyna się `tree.ts:84`) i zamyka na `tree.ts:251` — **nie na 307**. Linia 307 to koniec całego rodzicielskiego `Stage` `termin-minal` (`tree.ts:74-308`), który zawiera **dwa** SubType: `dzika-eksmisja-sub` (84-251) ORAZ `pozew-o-eksmisje` (253-307) — a tylko pierwszy z nich jest zduplikowany względem `dzika-eksmisja`. Zakres `~568–735` dla samodzielnego CaseType `dzika-eksmisja` był precyzyjny (otwiera się `tree.ts:569`, zamyka `tree.ts:735`) i nie wymaga korekty.

---

## Podsumowanie weryfikacji

- Wszystkie 12 plików fizycznych pod `public/documents/warszawa/` mają odpowiadającą referencję `filename` w `tree.ts` (16 referencji, 12 unikalnych ścieżek) — **brak plików osieroconych, brak referencji do nieistniejących plików**.
- Każdy z 15 obiektów Stage w `tree.ts` faktycznie respektuje regułę "documents XOR subTypes" — zgodność 100%, ale niewymuszona przez typy (I-1, D-4, D-7).
- Duplikacja `dzika-eksmisja-sub`/`dzika-eksmisja` jest **potwierdzona jako rzeczywista i dokładna** na liniach `tree.ts:85-251` (SubType, skorygowane z ~307 na 251) vs `tree.ts:569-735` (CaseType, bez zmian), ze zgodnością treści string-po-string sprawdzoną dla wszystkich trzech par węzłów potomnych.
- Odkryto jeden nowy, wcześniej nieodnotowany drobny rozjazd: martwy string `selectCity` w `ui.ts:4-11` (D-6), nieujęty w żadnym z istniejących dokumentów kontekstowych.
