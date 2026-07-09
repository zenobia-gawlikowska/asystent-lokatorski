---
title: Anti-Corruption Layer Plan — Asystent Lokatorski
created: 2026-07-09
type: refactor-plan
---

# Plan warstwy antykorupcyjnej (ACL) — Asystent Lokatorski

> Dokument planistyczny. Nie zawiera zmian w kodzie produkcyjnym. Każde twierdzenie faktyczne jest opatrzone cytatem `plik:linia` zweryfikowanym osobiście podczas pisania tego dokumentu. Tam, gdzie coś w kodzie faktycznie nie istnieje, napisano to wprost: **BRAK w kodzie** / **BRAK artefaktu**.

---

## KROK 0 — Odkrycie kontekstu

**Dokumenty bazowe przeczytane i zweryfikowane:**
- `context/foundation/prd.md` — PRD retrospektywny, sekcje Data model (`:101-111`), Testing strategy (`:123-127`), Non-goals (`:136-140`).
- `context/foundation/tech-stack.md` — frontmatter: `has_auth: false`, `has_payments: false`, `has_realtime: false`, `has_ai: false`, `has_background_jobs: false` (`context/foundation/tech-stack.md:15-19`).
- `context/architecture/repo-map.md` — mapa repozytorium plik-po-pliku.
- `context/domain/bounded-contexts.md` — nazywa "Document context" jako koncepcyjnie odrębny od "Routing context", choć fused w kodzie (`context/domain/bounded-contexts.md:13,21`).
- `context/changes/personalizacja-eligibility/research.md` — badanie (nie implementacja) dwóch funkcji: personalizacji dokumentów (Feature 1) i eligibility (Feature 2).

**Deklaracje o wymienialności, znalezione w dokumentach:**
- `context/domain/bounded-contexts.md:23`: "the natural boundary is: Routing context still says 'you are here, in Stage X'; Document context decides 'here is your document for Stage X' — either the existing static PDF, or a newly generated personalized one." To jest jedyna jawna deklaracja intencji wymienialności w tym repozytorium — mechanizm dostarczania dokumentu powinien być zamienny bez zmiany logiki routingu.
- `context/changes/personalizacja-eligibility/research.md:37-46` — tabela rankingowa opcji generowania PDF (`window.print()`, `jsPDF`, `@react-pdf/renderer`, `pdf-lib`, Cloudflare Workers AI, zewnętrzny LLM) — dokument jawnie rozważa **wymianę mechanizmu dostarczania dokumentu** w przyszłości, co jest bezpośrednim sygnałem, że dzisiejszy mechanizm (statyczny plik + `<a href download>`) nie jest traktowany jako trwały.

**Stack i zależności zewnętrzne — manifest pakietów zweryfikowany osobiście:**

Pełna zawartość `package.json` (`dependencies` + `devDependencies`) została odczytana. Zależności runtime: `@astrojs/cloudflare`, `@astrojs/react`, `@astrojs/sitemap`, `astro`, `react`, `react-dom`, `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`. Zależności dev: `@axe-core/react`, ESLint/Prettier tooling, `husky`, `lint-staged`, `typescript`, `vitest`, `wrangler`.

**Zweryfikowane bezpośrednio (grep na `package.json`)**: brak jakiejkolwiek zależności PDF (`jspdf`, `pdf-lib`, `@react-pdf/renderer`), brak SDK płatności (`stripe`, `payment`), brak biblioteki harmonogramowania (`schedul*`, `cron`), brak `@supabase/*` (potwierdzone też w `context/foundation/prd.md:93,116-117` — usunięte w commitach `2348ec9`, `5e88a57`, `b034eab`).

**Warstwy kodu**: `src/data/` (dane + typy), `src/lib/wizard-state.ts` (czysta logika), `src/components/Wizard.tsx` (jedyny komponent renderujący i konsumujący dane).

## KROK 1 — Identyfikacja przeciekających zależności

Zgodnie z metodologią, szukałem sygnałów: (a) ten sam pakiet w wielu warstwach, (b) zduplikowana rekonstrukcja obiektów biblioteki, (c) typy biblioteki przeciekające do kontraktów domenowych.

### Sprawdzenie klasycznego scenariusza — czy istnieje "przeciekająca biblioteka trzeciej strony"

**Wynik: NIE, i trzeba to powiedzieć wprost, żeby nie wymuszać fałszywej narracji.**

- Brak SDK płatności, brak harmonogramowania, brak SDK e-mail/SMS, brak żadnego zewnętrznego API klienta w kodzie źródłowym (`grep -rn "fetch(" src/` → brak wyników w odczytanych plikach; `Wizard.tsx` nie wykonuje żadnego wywołania sieciowego poza statycznym `<a href download>`).
- Jedyne zależności współdzielone między wielu plikami to `react`/`lucide-react`/Tailwind — ale to są narzędzia UI-warstwy prezentacji (ikony, stylowanie), nie biblioteki niosące *domenowy* kształt danych. Typ `DocumentType` (`src/data/types.ts:19-22`) nie pochodzi z żadnej biblioteki — jest własnym, ręcznie zdefiniowanym typem domenowym.
- `@axe-core/react` jest importowany wyłącznie w jednym miejscu, dynamicznie, tylko w dev (`src/components/Wizard.tsx:138-144`), tree-shaken w produkcji (`import.meta.env.DEV`) — nie przecieka do kontraktów domenowych, nie jest rekonstruowany w wielu miejscach.
- `@supabase/*` — historycznie istniało (per `tech-stack.md:24`: "the Supabase layer ships dormant"), ale zostało **w pełni usunięte** (3 commity cytowane w `prd.md:116-117`), więc nie jest to *aktywny* przeciek — to zamknięty rozdział, potwierdzony nieobecnością w `package.json`.

**Wniosek KROK 1 (klasyczny scenariusz)**: to małe MVP nie ma dziś żadnej trzeciej-stronowej biblioteki (schedulera, SDK płatności, klienta API), która przecieka przez wiele warstw kodu. Wymuszanie takiej narracji byłoby wymyślaniem faktu, którego nie ma — zgodnie z ograniczeniami tego zadania, szukam więc najsilniejszego **rzeczywiście uzasadnionego** ryzyka sprzężenia, które metodologia ACL może zaadresować.

### Alternatywny, realny kandydat: sprzężenie z **kształtem plików PDF jako statycznych, niewypełnialnych artefaktów**

To nie jest "biblioteka" w sensie npm-pakietu — to jest sprzężenie z **fizycznym kształtem zależności zewnętrznej** (istniejące pliki PDF autorstwa KOPL, poza kontrolą tego repozytorium), które `research.md` już jawnie identyfikuje jako blokujące przyszłą funkcję i które ma dokładnie te same symptomy, jakich szuka metodologia ACL: zduplikowana wiedza o "kształcie" zależności rozsiana po plikach, brak jednego wąskiego portu, i **udokumentowany, potwierdzony fakt**, że ten kształt nie nadaje się do zamierzonego przyszłego użycia.

**Sygnały zebrane (wszystkie pliki, które "znają" ten kształt, z `plik:linia`):**

1. **`src/data/types.ts:29-30`** — `Document.filename: string`, komentarz: `// Path under /public/documents/, always a Polish-language file`. To jest **jedyne miejsce w typie**, które koduje założenie "dokument = ścieżka do statycznego pliku", nie "dokument = struktura danych, którą można wyrenderować/wygenerować".
2. **`src/data/tree.ts`** — 16 wystąpień `filename:` (linie 61, 133, 162, 204, 246, 301, 360, 402, 487, 550, 617, 646, 688, 730, 785, 819), każde zakodowane jako literał string wskazujący na konkretny plik PDF pod `/documents/warszawa/`. Każdy z tych 16 literałów jest **osobną, ręcznie wpisaną instancją** tego samego założenia (statyczny plik, brak pól do wypełnienia).
3. **`src/components/Wizard.tsx:301-307`** — jedyny call site w całej aplikacji, który faktycznie konsumuje `doc.filename`:
   ```tsx
   <a
     href={doc.filename}
     download
     ...
   >
   ```
   Zweryfikowano przez `grep -rn "\.filename" src/` — **to jest jedyne wystąpienie** `doc.filename` poza samą definicją typu i danymi. Nie jest to "rozsiane po wielu warstwach" w sensie liczby call-site'ów (jest ich jeden), ale **jest** to jedyne miejsce, które zakłada, że `filename` prowadzi do gotowego-do-pobrania, statycznego, niewypełnialnego pliku — założenie, które `research.md` już podważa jako blokujące.
4. **`context/changes/personalizacja-eligibility/research.md:88-92`**: *"Istniejące pliki PDF w `public/docs/` to statyczne dokumenty KOPL — nie mają pól AcroForm (`/AcroForm` w drzewie PDF)... Nie ma 'magicznego' wstrzyknięcia tekstu w dowolne miejsce skanu."* To jest **potwierdzony, zdiagnozowany fakt** o kształcie zależności zewnętrznej (pliki PDF autorstwa KOPL) — nie hipoteza.
5. **`context/changes/personalizacja-eligibility/research.md:94-95`**: *"Realny wybór to wygenerowanie nowego dokumentu, nie modyfikacja istniejącego."* — to jest wniosek, który **wymaga zupełnie innego kształtu danych** niż `filename: string` (potrzeba: szablonu, pól do wypełnienia, silnika renderowania) — a dzisiejszy typ `Document` nie ma żadnego miejsca na to rozróżnienie.
6. **`context/domain/bounded-contexts.md:17-23`** — już nazywa to ryzyko koncepcyjnie ("Document context" jako miejsce, gdzie ta decyzja powinna żyć), ale bez konkretnego projektu granicy.

**Dlaczego to jest prawdziwy przypadek ACL, nie wymuszona analogia**: zależność zewnętrzna tutaj to nie pakiet npm, ale **zakładany kształt artefaktu dokumentu** (statyczny plik PDF bez pól, jeden per `Document.id`), zakodowany w jednym polu typu (`filename: string`) i skonsumowany w jednym miejscu UI (`href={doc.filename}` + atrybut `download`). Ten kształt **przecieka wprost do kontraktu domenowego** `Document` — nie ma żadnej abstrakcji między "to jest odpowiedź prawna na Twoją sytuację" (domenowa treść: `name`, `description`, `note`, `documentType`) i "to jest string ścieżki do konkretnego formatu pliku" (szczegół dostawy). Gdyby jutro trzeba było dodać wygenerowany-na-żądanie PDF (`window.print()` + HTML, per `research.md:96-123`) albo `jsPDF` (`research.md:125-140`) jako alternatywny sposób dostawy dla tego samego `Document`, **nie istnieje dziś żadne miejsce**, w którym ta decyzja mogłaby zostać podjęta bez zmiany typu `Document` i jedynego call site'u w `Wizard.tsx` jednocześnie.

## KROK 2 — Klasyfikacja i wybór #1

Oceniam kandydata na trzech osiach z instrukcji zadania: (a) liczba warstw/plików, (b) ryzyko/koszt wymiany, (c) rozjazd intencja-vs-kod.

| Kandydat | (a) Liczba plików, które znają kształt | (b) Ryzyko/koszt wymiany dziś | (c) Rozjazd intencja-vs-kod |
|---|---|---|---|
| **Statyczny-PDF-jako-jedyny-kształt dokumentu** | 3 pliki bezpośrednio: `src/data/types.ts:29-30` (typ), `src/data/tree.ts` (16 literałów danych), `src/components/Wizard.tsx:301-307` (jedyny konsument). Plus 1 dokument planistyczny (`research.md`) jawnie opisujący potrzebę zmiany tego kształtu. | **Wysokie, mimo małej liczby plików.** Zmiana kształtu (dodanie generowanego-na-żądanie PDF jako alternatywy) wymagałaby zmiany typu `Document` (dodanie nowego wariantu pola) ORAZ jedynego renderującego miejsca w `Wizard.tsx` ORAZ przemyślenia, co się dzieje z istniejącymi 16 literałami `filename` w `tree.ts` — nie jest to izolowane do jednego adaptera, bo dziś nie ma żadnego adaptera. | **Wysoki i udokumentowany.** `bounded-contexts.md:23` już deklaruje intencję ("the Document context decides... either the existing static PDF, or a newly generated personalized one" — czas przyszły, nieistniejący w kodzie), a `research.md:33-35` stwierdza wprost: "nie ma gotowej ścieżki do personalizacji istniejących PDF-ów" — to jest rozjazd między zadeklarowaną przyszłą wymienialnością i dzisiejszym kodem, który nie ma żadnego miejsca na tę wymienialność. |
| Trzecio-stronowa biblioteka (klasyczny scenariusz ACL) | 0 plików — **nie istnieje** (KROK 1, zweryfikowane przez `package.json` i grep na `fetch`) | N/A | N/A — brak przedmiotu do oceny |
| `lucide-react` (ikony) w `DOC_TYPE_CONFIG` | 1 plik: `src/components/Wizard.tsx:2,18-22` | Niskie — wymiana biblioteki ikon dotyka jednego obiektu konfiguracyjnego, żadnego kontraktu domenowego (`DocumentType` jest własnym typem, ikony są tylko wizualną reprezentacją) | Niski — nie ma żadnej deklaracji intencji wymiany tej biblioteki w dokumentach |

**Wybór #1: kształt "dokument = statyczny plik PDF bez pól" jako jedyna dzisiejsza reprezentacja `Document`, skodowana w `Document.filename: string` i skonsumowana wyłącznie przez `href={doc.filename} download` w `src/components/Wizard.tsx:301-307`.**

**Uzasadnienie wyboru, zgodnie z instrukcją zadania** ("nie forsować cienkiej historii, ale nie pomijać artefaktu — znajdź najlepszy realny cel, jaki popierają dowody"):

1. To jest **najgorszy realnie istniejący przeciek** w tym repozytorium, mimo że nie pasuje do klasycznego wzorca "pakiet npm w wielu warstwach" — bo jest to jedyny przypadek, gdzie (a) istnieje udokumentowana, jawna intencja przyszłej wymiany mechanizmu (`bounded-contexts.md:23`, `research.md` cała treść), i (b) dzisiejszy kod nie ma żadnej granicy, przez którą tę wymianę można by przeprowadzić bez zmiany kontraktu domenowego `Document`.
2. Koszt wymiany jest wysoki nie dlatego, że kod jest rozległy (jest bardzo mały — 3 pliki), ale dlatego, że **nie istnieje żaden adapter do zmiany** — cała wiedza "jak dostarczyć dokument" jest wtopiona w jedno pole typu i jedną linijkę JSX. Zmiana wymaga dotknięcia domeny (`Document`), nie tylko infrastruktury.
3. Jest to zgodne z instrukcją zadania: nie ma tu klasycznego SDK-płatności/schedulera do wymienienia, więc stosuję tę samą metodologię do najsilniejszego, faktycznie potwierdzonego ryzyka sprzężenia, które `research.md` już przewiduje jako przyszły blocker — nie forsuję fałszywej historii o pakiecie, który nie istnieje.

## KROK 3 — Diagnoza: duplikacja i przecieki przez granice

**Duplikacja wiedzy o kształcie "dokument = plik statyczny"** (nie duplikacja kodu w sensie kopiuj-wklej, ale duplikacja *założenia* w wielu niezależnych miejscach, które muszą być zmienione zgodnie, jeśli założenie się zmieni):

| Miejsce | Co zakłada o kształcie dokumentu | Cytat |
|---|---|---|
| `src/data/types.ts:24-35` | `Document` ma pole `filename: string` jako **jedyny** sposób dostarczenia treści — nie ma pola typu `template`, `generator`, ani unii typów rozróżniającej "statyczny plik" od "generowany na żądanie" | `filename: string; // Path under /public/documents/, always a Polish-language file` (linia 29-30) |
| `src/data/tree.ts` (16 miejsc) | Każdy z 16 literałów `filename: "/documents/warszawa/*.pdf"` osobno zakłada, że string wskazuje na plik, który *już istnieje i jest gotowy do pobrania* — żadna warstwa abstrakcji między "ID dokumentu" i "konkretna ścieżka pliku" | np. `src/data/tree.ts:61`: `filename: "/documents/warszawa/sprzeciw-wypowiedzenie.pdf"` |
| `src/components/Wizard.tsx:301-307` | Renderowanie zakłada, że `doc.filename` jest zawsze bezpośrednio linkowalnym URL-em obsługującym atrybut `download` przeglądarki — nie ma żadnego wywołania funkcji "resolve dokument", tylko bezpośrednie użycie stringa w JSX | `<a href={doc.filename} download>...</a>` |
| `context/changes/personalizacja-eligibility/research.md:96-140` | Opisuje DWIE alternatywne przyszłe implementacje (`window.print()` + HTML, `jsPDF`), obie generujące **zupełnie inny rodzaj artefaktu** (dynamicznie renderowany HTML-do-druku albo programistycznie budowany PDF w pamięci przeglądarki) — żadna z nich nie pasuje do kształtu `filename: string` wskazującego na plik na dysku | Kod przykładowy `printWindow?.document.write(...)` (linia 102) i `doc.save("wezwanie.pdf")` (jsPDF, linia 136) — obie metody nie produkują `string`-ścieżki, produkują efekt uboczny (otwarcie okna drukowania / zapis pliku z przeglądarki) |

**Przecieki przez granice**: granica między "Routing context" (który `Stage` odpowiada sytuacji) i "Document context" (jak dostarczyć artefakt dla tej sytuacji) — nazwana koncepcyjnie w `context/domain/bounded-contexts.md:5-23` — **nie istnieje jako granica w kodzie**. `Stage.documents` (`src/data/types.ts:48`) jest polem tego samego obiektu, który `deriveWizardNodes` (`src/lib/wizard-state.ts:48-71`) przechodzi jako część logiki routingu — nie ma żadnego interfejsu, funkcji, czy modułu, który przechwytuje moment "wiem już, jaki `Stage` odpowiada sytuacji" i przekazuje go do osobnej odpowiedzialności "teraz zdecyduj, jak dostarczyć dokument dla tego `Stage`". Kod dzisiejszy **zakłada odpowiedź na pytanie "jak dostarczyć"** (zawsze: statyczny plik, zawsze: `<a href download>`) w tym samym miejscu, gdzie odpowiada na pytanie "co dostarczyć" (`resultStage.documents`, `src/components/Wizard.tsx:286`).

## KROK 4 — Projekt ACL

### Domenowy value object — jedyne miejsce wiedzy o kształcie dostawy dokumentu

```typescript
// src/domain/document-delivery.ts (nowy plik — NIE istnieje dzisiaj, BRAK w kodzie)

// Domenowy kontrakt: "jak dostarczyć treść tego Document tenantowi", oddzielony
// od pytania "który Document odpowiada tej sytuacji" (to wciąż Routing context / tree.ts).
// To jest wąski port — jedyna rzecz, jaką Wizard.tsx powinien znać o dostawie.
interface DocumentDelivery {
  // Zwraca URL gotowy do użycia w <a href download> LUB rzuca, jeśli dostawa
  // wymaga akcji (np. otwarcia okna do druku) — patrz warianty poniżej.
  resolve(document: Document): DeliveryResult;
}

// Nazwany typ wyniku — zamiast zakładać, że wynik ZAWSZE jest linkiem do statycznego pliku.
type DeliveryResult =
  | { kind: "static-file"; url: string } // dzisiejszy, jedyny istniejący przypadek
  | { kind: "print-on-demand"; render: () => void } // przyszłość: window.print() + HTML, research.md:96-123
  | { kind: "generated-pdf"; render: () => Promise<Blob> }; // przyszłość: jsPDF, research.md:125-140

// Adapter dla dzisiejszego, jedynego istniejącego przypadku — nic więcej.
class StaticFileDelivery implements DocumentDelivery {
  resolve(document: Document): DeliveryResult {
    return { kind: "static-file", url: document.filename };
  }
}
```

**Sygnatury i pseudokod dla `Wizard.tsx` po refaktoryzacji**:

```typescript
// Wizard.tsx nie odczytuje już doc.filename bezpośrednio.
const delivery: DocumentDelivery = new StaticFileDelivery(); // dziś: jedyna implementacja

function renderDownload(doc: Document, delivery: DocumentDelivery) {
  const result = delivery.resolve(doc);
  switch (result.kind) {
    case "static-file":
      return <a href={result.url} download>{t(UI.download, lang)}</a>;
    case "print-on-demand":
      return <button onClick={result.render}>{t(UI.download, lang)}</button>;
    case "generated-pdf":
      return <button onClick={() => { void result.render().then(saveBlob); }}>{t(UI.download, lang)}</button>;
  }
}
```

### Wąski port i adapter — definicja

- **Port** (interfejs, żyje w domenie): `DocumentDelivery.resolve(document: Document): DeliveryResult`. To jest **jedyna** metoda, jaką `Wizard.tsx` może wywołać, żeby dostać sposób dostarczenia dokumentu. Port nie wie nic o `filename`, `jsPDF`, `window.print()`, ani żadnym konkretnym mechanizmie — tylko o typie `DeliveryResult`.
- **Adapter** (implementacja, żyje osobno, np. `src/adapters/document-delivery/`): `StaticFileDelivery` (dzisiejszy, jedyny), a w przyszłości równolegle `PrintOnDemandDelivery`, `JsPdfDelivery` — każdy adapter wie o SWOIM mechanizmie (odpowiednio: nic specjalnego dziś; `window.print()`/HTML; `jsPDF` API), ale **żaden inny plik w aplikacji nie musi o nim wiedzieć**.
- **Value object graniczny**: `DeliveryResult` — jedyny typ, który przekracza granicę adapter → domena. Zawiera tylko to, czego `Wizard.tsx` potrzebuje (URL albo funkcję do wywołania), nigdy typy biblioteki (`jsPDF` instancję, `Blob` z konkretnej biblioteki PDF) bezpośrednio w kontrakcie domenowym poza jednym, jawnie nazwanym wariantem `generated-pdf`, gdzie `Blob` jest standardowym typem webowym (nie typem biblioteki), więc nie stanowi przecieku.

## KROK 5 — Dowód izolacji + before/after

**Dowód, że wymiana mechanizmu dostawy dotyka wyłącznie adaptera**: jeśli w przyszłości KOPL zdecyduje się zastąpić statyczne pliki generowanym-na-żądanie PDF-em (`jsPDF`, per `research.md:125-140`), zmiana dotyczy:
1. Nowego pliku adaptera `JsPdfDelivery implements DocumentDelivery` (nowy plik, zero zmian w istniejących).
2. Jednej linii w miejscu kompozycji (`const delivery: DocumentDelivery = new JsPdfDelivery()` zamiast `new StaticFileDelivery()`), analogicznej do `context/architecture/refactoring-plan.md`'s wzorca "wstrzyknij implementację w jednym miejscu".
3. **Zero zmian** w `src/data/tree.ts` (dane `CaseType`/`Stage`/`Document` pozostają identyczne — `Document` nie musi nawet zawierać `filename`, jeśli adapter generuje treść z innych pól, choć w praktyce `filename` prawdopodobnie zostałoby zachowane jako identyfikator szablonu).
4. **Zero zmian** w `src/lib/wizard-state.ts` (Routing context — `deriveWizardNodes` nie wie i nie musi wiedzieć, jak dostarczany jest dokument).

| Miejsce | Przed | Po |
|---|---|---|
| `src/data/types.ts:24-35` (`Document`) | `filename: string` — jedyny sposób referencji do treści dokumentu, zakłada statyczny plik | Bez zmian w tym polu (pozostaje jako identyfikator/URL bazowy), ale przestaje być **jedynym** miejscem prawdy o dostawie — ta wiedza przenosi się do `DocumentDelivery`/`DeliveryResult`. |
| `src/components/Wizard.tsx:301-307` (`<a href={doc.filename} download>`) | Jedyny call site, hard-coded na `<a href download>`, zakłada zawsze-statyczny-plik | Wywołuje `delivery.resolve(doc)` i renderuje zależnie od `DeliveryResult.kind` — patrz KROK 4 pseudokod. |
| `context/domain/bounded-contexts.md:17-23` (deklaracja intencji, dokument) | Opisuje przyszłą wymienialność jako *koncepcję*, bez odpowiadającej granicy w kodzie | Koncepcja z dokumentu ma teraz odpowiadający, realny port (`DocumentDelivery`) i miejsce kompozycji — dokument i kod są zgodne. |
| `context/changes/personalizacja-eligibility/research.md:96-140` (dwie zbadane opcje) | Opisane jako proza/pseudokod bez miejsca w architekturze, gdzie by "wpiąć" | Odpowiadają dokładnie dwóm nowym adapterom (`PrintOnDemandDelivery`, `JsPdfDelivery`) implementującym ten sam port — badanie staje się bezpośrednio wdrażalne bez dalszego projektowania granic. |

## KROK 6 — Weryfikacja i plan

**Kryterium sukcesu (zgodnie z instrukcją zadania)**: po wdrożeniu tego planu, `grep -rn "\.filename" src/` powinien zwracać wyniki **wyłącznie** w katalogu adaptera (np. `src/adapters/document-delivery/static-file-delivery.ts`) i w samej definicji danych (`src/data/tree.ts`, `src/data/types.ts` — bo `filename` jako pole danych pozostaje, tylko jego *konsumpcja* się zmienia), nigdy w `src/components/Wizard.tsx`.

**Stan dzisiejszy — pliki, które znają kształt "dokument = statyczny plik" (zweryfikowane osobiście, `grep -rn "\.filename" src/` w tej sesji)**:
- `src/components/Wizard.tsx:302` — `href={doc.filename}` — **to jest jedyne wystąpienie poza definicją typu/danych**, i to jest dokładnie ten call site, który po refaktoryzacji powinien zniknąć (zastąpiony wywołaniem `delivery.resolve(doc)`).
- `src/data/types.ts:29-30` — definicja pola (pozostaje, jako dane, nie jako logika konsumpcji).
- `src/data/tree.ts` — 16 literałów (pozostają, jako dane).

**Plan wdrożenia (fazowy, zgodny ze stylem `02-invariant-aggregate-refactor.md`)**:

1. **Faza 0 — test-first.** Napisać test `tests/document-delivery.test.ts` sprawdzający, że `StaticFileDelivery.resolve(doc)` zwraca `{ kind: "static-file", url: doc.filename }` dla dowolnego `Document` — to formalizuje dzisiejsze zachowanie jako regresję do ochrony, zanim jakikolwiek kod produkcyjny się zmieni.
2. **Faza 1 — zaimplementować port + `StaticFileDelivery`** w nowym module (np. `src/domain/document-delivery.ts` dla portu, `src/adapters/document-delivery/static-file-delivery.ts` dla adaptera), bez dotykania `Wizard.tsx`.
3. **Faza 2 — przepiąć `Wizard.tsx:301-307`** na `delivery.resolve(doc)` + `switch` po `DeliveryResult.kind`, z `StaticFileDelivery` jako jedyną wstrzykiwaną implementacją (zachowuje dzisiejsze zachowanie 1:1, weryfikowalne testem z Fazy 0 plus istniejącym zestawem 29 testów `wizard-state.test.ts`, które nie powinny się zmienić, bo nie dotykają UI).
4. **Faza 3 (opcjonalna, "can wait", uruchamiana tylko jeśli/kiedy personalizacja faktycznie wejdzie w roadmapę)** — dodać `PrintOnDemandDelivery` lub `JsPdfDelivery` jako drugi adapter, zgodnie z rekomendacją `research.md`. Nie implementować przed decyzją biznesową — `research.md`'s Open Question #1 (`context/changes/personalizacja-eligibility/research.md:314`) pozostaje nierozwiązane i to jest zamierzone: ten ACL przygotowuje granicę, nie przesądza, czy i kiedy druga implementacja powstanie.

**Kryterium weryfikacji sukcesu po Fazie 2**: `grep -rn "doc\.filename\|\.filename\b" src/components/` zwraca zero wyników — cała wiedza o tym, że dostawa dokumentu OZNACZA `href` + atrybut `download`, żyje wyłącznie w `src/adapters/document-delivery/static-file-delivery.ts`.

---

## Podsumowanie

Ta aplikacja nie ma dzisiaj klasycznego "przeciekającego pakietu trzeciej strony" (brak SDK płatności, schedulera, czy klienta API w wielu warstwach) — zweryfikowano to bezpośrednio przez pełny odczyt `package.json` i grep na `fetch(` w `src/`, bez pozytywnego wyniku. Zamiast wymuszać fałszywą narrację, zastosowano tę samą metodologię ACL do najsilniejszego realnie potwierdzonego ryzyka sprzężenia: kształt "dokument = statyczny plik PDF bez pól AcroForm" jest zakodowany w jednym polu typu (`Document.filename: string`, `src/data/types.ts:29-30`), powtórzony jako 16 literałów w `src/data/tree.ts`, i skonsumowany w jednym, ale krytycznym miejscu — `<a href={doc.filename} download>` w `src/components/Wizard.tsx:301-307` — bez żadnej granicy pozwalającej na przyszłą wymianę mechanizmu dostawy. Ten przeciek jest udokumentowany jako realny, przewidywany problem w `context/changes/personalizacja-eligibility/research.md` (potwierdzony fakt: istniejące PDF-y nie mają pól AcroForm, więc personalizacja wymaga zupełnie innego mechanizmu generowania) oraz w `context/domain/bounded-contexts.md:23`, który deklaruje intencję wymienialności bez odpowiadającej jej granicy w kodzie. Proponowany ACL wprowadza wąski port `DocumentDelivery` z jedną metodą `resolve()` i nazwanym typem wyniku `DeliveryResult`, z `StaticFileDelivery` jako jedynym dzisiejszym adapterem — po wdrożeniu, wymiana na `jsPDF` lub `window.print()`-owe generowanie dotyka wyłącznie nowego adaptera i jednej linii kompozycji, zero zmian w `tree.ts` czy `wizard-state.ts`. Kryterium sukcesu (`grep` po `.filename` w `src/components/` zwraca zero wyników po refaktoryzacji) jest konkretne i weryfikowalne, zgodnie z wymogiem zadania.
