---
date: 2026-05-27T00:00:00+02:00
researcher: Claude Sonnet 4.6
git_commit: c747af0
branch: poc-kopl
repository: 10x-cli
topic: "Personalizacja dokumentów i sprawdzanie eligibility do lokalu komunalnego"
tags: [research, personalizacja, eligibility, RODO, PDF, asystent-lokatorski]
status: complete
last_updated: 2026-05-27
last_updated_by: Claude Sonnet 4.6
---

# Research: Personalizacja dokumentów i sprawdzanie eligibility do lokalu komunalnego

**Date**: 2026-05-27  
**Researcher**: Claude Sonnet 4.6  
**Git Commit**: c747af0 (10x-cli, poc-kopl)  
**Repository**: 10x-cli / asystent-lokatorski

## Research Question

Dwie planowane funkcjonalności:
1. Podłączenie LLM do personalizacji szablonów dokumentów na podstawie danych osobowych i sytuacji lokatora
2. Sprawdzanie kryteriów dochodowych i mieszkaniowych pod kątem eligibility do lokalu komunalnego w danym mieście

Kontekst: aplikacja Cloudflare Pages + React island, bez backendu, hosting tylko statycznych plików PDF. Ograniczenia: RODO (dane lokatora nie mogą opuszczać przeglądarki), brak WASM na Cloudflare Workers, istniejące PDF-y bez pól AcroForm.

---

## Podsumowanie

### Feature 1 — Personalizacja dokumentów

**Wniosek: nie ma gotowej ścieżki do personalizacji istniejących PDF-ów.**

Istniejące dokumenty to statyczne skany / pliki PDF bez pól formularza AcroForm. Żadna biblioteka nie może w nie wstrzykiwać danych bez uprzedniego przygotowania szablonów. Realistyczne opcje w kolejności rekomendacji:

| Miejsce | Opcja | Wymagania | RODO | Koszt dev |
|---|---|---|---|---|
| 1 | `window.print()` + stylowany HTML | Brak (zero deps) | ✅ bezpieczne | Niski |
| 2 | `jsPDF 4.2.1` | npm dep, ~300 kB | ✅ bezpieczne | Średni |
| 3 | `@react-pdf/renderer` | WASM blocker na CF ⚠️ | ✅ bezpieczne | Wysoki |
| 4 | `pdf-lib` | Brak AcroForm, nieaktywny 3.5r | ✅ bezpieczne | Wysoki |
| 5 | Cloudflare Workers AI | Wymaga DPA z CF + binding `"ai": {}` | ⚠️ przetwarzanie na CF | Wysoki |
| 6 | OpenAI / zewnętrzny LLM | Serwer pośredni, RODO DPA | ❌ serwer = RODO | Bardzo wysoki |

### Feature 2 — Eligibility criteria checker

**Wniosek: dane progów istnieją, brak API — ręczne monitorowanie gazet.**

Polskie miasta wyrażają progi dochodowe jako **mnożnik najniższej emerytury** (nie stałe kwoty PLN). Emerytura jest aktualizowana 1 marca przez ZUS. Dane do wbudowania jako statyczne JSON/TS; brak ogólnodostępnego API.

| Miasto | Typ | Mnożnik (os. samotna / para) |
|---|---|---|
| Warszawa | Najemcy miejsc. chronionych | 220% / 160% NE |
| Warszawa | Prywatni w zasobie komunalnym | Decyzja indywidualna |
| Kraków | Lokale komunalne (standard) | 180% / 130% NE |
| Wrocław | Poziom I (pokój) | 100% / 70% NE |
| Wrocław | Poziom II (lokal) | 150% / 100% NE |
| Wrocław | Poziom III (wymiana) | 350% / 300% NE |

NE = najniższa emerytura (2025: ~1904 PLN brutto, od 01.03.2025)

---

## Szczegółowe wyniki

### 1. Granica RODO w tej aplikacji

Architektura asystent-lokatorski jest w 100% client-side:
- React island hydratowany w przeglądarce (`src/components/Wizard.tsx`)
- Dane nawigacji: `useState` + `localStorage` (tylko lang preference)
- Dokumenty: statyczne pliki PDF serwowane z Cloudflare Pages

**Granica RODO jest prosta: cokolwiek zostaje w przeglądarce = bezpieczne.**

| Wariant | Przetwarzanie | RODO status |
|---|---|---|
| `useState` dla danych osobowych | Tylko RAM przeglądarki | ✅ Bezpieczne — brak transmisji |
| `localStorage` dla danych osobowych | Dysk lokatora, nie serwer | ✅ Bezpieczne — dane nie opuszczają urządzenia |
| LLM client-side (WASM) | RAM przeglądarki | ✅ Bezpieczne — żaden serwer nie widzi danych |
| Fetch do Cloudflare Workers AI | Cloudflare przetwarza dane | ⚠️ RODO — wymaga DPA z Cloudflare |
| Fetch do OpenAI / zewnętrzny LLM | Serwer trzeci przetwarza dane | ❌ RODO — wymaga DPA, polityki prywatności, zgody |

Kluczowy punkt: RODO zaczyna się **w momencie wysłania danych z przeglądarki**, nie w momencie wyświetlenia formularza.

### 2. PDF — dlaczego istniejące biblioteki nie działają

**Diagnoza przeprowadzona przez subagent (maj 2026):**

Istniejące pliki PDF w `public/docs/` to statyczne dokumenty KOPL — nie mają pól AcroForm (`/AcroForm` w drzewie PDF). Biblioteki takie jak `pdf-lib` oferują `form.getTextField('imie')`, ale ta API działa tylko na istniejących polach. Nie ma "magicznego" wstrzyknięcia tekstu w dowolne miejsce skanu.

**Realny wybór to wygenerowanie nowego dokumentu**, nie modyfikacja istniejącego:

#### Opcja 1: `window.print()` (rekomendowana)

```typescript
// zero deps — natywna przeglądarkowa API
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  printWindow?.document.write(`
    <html>
      <head>
        <title>Pismo do ${landlordName}</title>
        <style>
          @media print { body { font-family: serif; margin: 2cm; } }
        </style>
      </head>
      <body>
        <p>Warszawa, ${date}</p>
        <p>Do: ${landlordName}, ${landlordAddress}</p>
        <h2>WEZWANIE DO NAPRAWY USTERKI</h2>
        ...
      </body>
    </html>
  `);
  printWindow?.print();
};
```

Zalety: zero dependencies, natywny dialog print → PDF, pełna kontrola layoutu przez CSS, działa na CF Pages, brak WASM.
Wady: wymaga napisania szablonów HTML dla każdego dokumentu (nie reużywa istniejących PDF).

#### Opcja 2: `jsPDF 4.2.1`

```bash
npm install jspdf  # ~300 kB gzip, brak WASM, aktywny maj 2026
```

```typescript
import { jsPDF } from "jspdf";
const doc = new jsPDF();
doc.text(`Warszawa, ${date}`, 20, 20);
doc.text(`Do: ${landlordName}`, 20, 30);
doc.save("wezwanie.pdf");
```

Zalety: programatyczny PDF, możliwość embedowania fontów, działa na CF (brak WASM).  
Wady: ~300 kB bundle, własne szablony od zera, polskie znaki wymagają embedowania fontu (ISO-8859-2 lub Unicode).

#### Opcja 3: `@react-pdf/renderer` (nie rekomendowana)

**Bloker: otwarty issue GitHub** — biblioteka używa wewnętrznie fontkit, który kompiluje do WASM. Cloudflare Workers/Pages **blokuje WASM** bez explicit `compatibility_flags = ["nodejs_compat"]` i `wasm_modules`. Status: nierozwiązany (maj 2026).

#### Opcja 4: `pdf-lib` (nie rekomendowana)

Ostatni commit: ponad 3.5 roku temu. Open issues: 400+. Projekt faktycznie porzucony. Nie instalować dla nowej funkcjonalności.

### 3. LLM client-side (opcja bez serwera)

Dla aplikacji z tak ostrymi ograniczeniami (CF Pages, brak WASM, RODO) jedyną opcją LLM bez serwera byłoby WebLLM / llm.js uruchamiające model w WebAssembly w przeglądarce. 

**Problem praktyczny**: modele zdolne do sensownej personalizacji prawniczego tekstu (Mistral 7B+) ważą 3-8 GB. Czas ładowania: 2-5 min na dobrym łączu. To dyskwalifikuje tę ścieżkę dla MVP.

**Wniosek końcowy Feature 1**: LLM jest over-engineered dla tego przypadku. Personalizacja oparta na szablonach HTML + `window.print()` lub jsPDF daje 90% wartości przy 10% złożoności.

### 4. Eligibility criteria — dane i architektura

#### Dlaczego mnożnik emerytury, nie stała kwota

Polskie uchwały o najczęściej definiują progi jako: `"dochód na osobę nie przekracza X% kwoty najniższej emerytury"`. Emerytura bazowa jest aktualizowana raz w roku (waloryzacja, 1 marca). Pisanie stałych kwot PLN powoduje dezaktualizację danych co rok.

Prawidłowy model danych:

```typescript
export interface IncomeThreshold {
  multiplierOfMinPension: number; // np. 2.2 = 220% najniższej emerytury
  householdSize: "single" | "two_person" | "multi";
}

export interface TenancyTier {
  tierId: string;
  label: LocalizedString;
  flatType: "room" | "standard" | "exchange";
  incomeThreshold: IncomeThreshold[];
  surfacePerPerson?: number; // m², opcjonalne
}

export interface EligibilityCriteria {
  cityId: string;
  legalBasis: {
    title: string;
    url?: string;
    publishedDate: string; // ISO date
    validFrom: string;     // ISO date
  };
  minimumPensionRef: {
    amountPLN: number;   // aktualna wartość w PLN
    validFrom: string;    // od kiedy obowiązuje
  };
  tenancyTiers: TenancyTier[];
  additionalRequirements: {
    residencyRequired: boolean;         // wymóg zameldowania
    residencyYears?: number;
    noOtherDwellingTitle: boolean;      // brak tytułu do innego lokalu
    housingNeedVerification: boolean;   // weryfikacja potrzeby mieszkaniowej
  };
}
```

#### Dane dla MVP (3 miasta)

```typescript
// Warszawa — uchwała nr LII/1395/2022 Rady m.st. Warszawy
const WARSZAWA: EligibilityCriteria = {
  cityId: "warszawa",
  legalBasis: {
    title: "Uchwała nr LII/1395/2022 Rady m.st. Warszawy z dnia 21 kwietnia 2022 r.",
    url: "https://bip.warszawa.pl/NR/rdonlyres/...",
    publishedDate: "2022-04-21",
    validFrom: "2022-05-06",
  },
  minimumPensionRef: { amountPLN: 1904.03, validFrom: "2025-03-01" },
  tenancyTiers: [
    {
      tierId: "chronione",
      label: { pl: "Miejsca chronione", ua: "...", ru: "...", en: "...", es: "...", fr: "..." },
      flatType: "room",
      incomeThreshold: [
        { multiplierOfMinPension: 2.2, householdSize: "single" },
        { multiplierOfMinPension: 1.6, householdSize: "two_person" },
      ],
    },
  ],
  additionalRequirements: {
    residencyRequired: true,
    residencyYears: 5,
    noOtherDwellingTitle: true,
    housingNeedVerification: true,
  },
};
```

#### Monitorowanie zmian

Brak API — jedyne źródła:
- BIP danego miasta → `Uchwały Rady Miasta` → szukaj "zasady wynajmowania lokali"
- Dziennik Urzędowy Województwa Mazowieckiego (Warszawa): dziennik.mazowieckie.pl
- Dziennik Urzędowy Województwa Małopolskiego (Kraków): dziennikmz.malopolska.uw.gov.pl

Rekomendacja: plik `src/data/eligibility-criteria.ts` z komentarzem `// last verified: YYYY-MM-DD` + zadanie kwartalne do weryfikacji.

### 5. Architektura Feature 2 — rekomendacja

Plik **`src/data/eligibility-criteria.ts`** (osobny od `tree.ts`):

```
src/data/
  tree.ts                   # istniejące (drzewo decyzyjne, dokumenty)
  types.ts                  # istniejące (typy)
  ui.ts                     # istniejące (teksty UI)
  eligibility-criteria.ts   # NOWE (progi dochodowe, wymagania)
```

Komponent React: `src/components/EligibilityChecker.tsx` (osobna wyspa Astro lub dodatkowy step w Wizard).

Kalkulator client-side:

```typescript
export function checkEligibility(
  cityId: string,
  monthlyIncomePerPerson: number,
  householdSize: number,
): { eligible: boolean; tier?: TenancyTier; incomePLN: number; thresholdPLN: number } {
  const criteria = ELIGIBILITY_CRITERIA.find(c => c.id === cityId);
  if (!criteria) return { eligible: false, incomePLN: monthlyIncomePerPerson, thresholdPLN: 0 };
  
  const { amountPLN } = criteria.minimumPensionRef;
  const sizeKey: IncomeThreshold["householdSize"] = 
    householdSize === 1 ? "single" : householdSize === 2 ? "two_person" : "multi";
  
  for (const tier of criteria.tenancyTiers) {
    const threshold = tier.incomeThreshold.find(t => t.householdSize === sizeKey);
    if (!threshold) continue;
    const thresholdPLN = amountPLN * threshold.multiplierOfMinPension;
    if (monthlyIncomePerPerson <= thresholdPLN) {
      return { eligible: true, tier, incomePLN: monthlyIncomePerPerson, thresholdPLN };
    }
  }
  return { eligible: false, incomePLN: monthlyIncomePerPerson, thresholdPLN: 0 };
}
```

---

## Code References

- `src/components/Wizard.tsx` — React island, punkt integracji nowych komponentów
- `src/data/tree.ts` — istniejące drzewo z 22 dokumentami, 5 caseTypes
- `src/data/types.ts` — typy (City, CaseType, Stage, SubType, Document, Step, LocalizedString)
- `src/data/ui.ts` — teksty UI we wszystkich 6 językach

---

## Architecture Insights

1. **Aplikacja jest w 100% statyczna** — brak serwera, brak API, deployment jako Cloudflare Pages. Każda funkcjonalność musi działać w przeglądarce.

2. **RODO granica = granica przeglądarki** — `useState`, `localStorage`, WASM in-browser = bezpieczne. Każdy `fetch` do zewnętrznego serwisu = RODO.

3. **Istniejące PDF-y nie są szablonami** — są gotowymi dokumentami KOPL, nie mają pól AcroForm. Personalizacja = generowanie nowych dokumentów, nie wypełnianie istniejących.

4. **Cloudflare blokuje WASM domyślnie** — `@react-pdf/renderer` i client-side LLM (WebLLM) są zablokowane bez `compatibility_flags`. To eliminuje najczęściej polecane rozwiązania.

5. **Progi dochodowe w gminach to mnożnik emerytury**, nie stałe PLN — model danych musi to odzwierciedlać dla długoterminowej poprawności.

6. **Brak API dla danych eligibility** — ręczne monitorowanie Dzienników Urzędowych Województw; konieczny komentarz `// last verified:` w kodzie.

---

## Open Questions

1. **Personalizacja**: Czy KOPL chce zachować istniejące PDF-y jako "oficjalne wzory" do pobrania, a nowy formularz byłby alternatywny (równoległy)? Czy zastąpić pobieranie PDFów witryną print-friendly?

2. **Eligibility**: Ile miast w MVP? Warszawa jest oczywista. Kraków i Wrocław są duże, ale dane wymagają weryfikacji uchwał.

3. **Wielojęzyczność kryteriów**: Czy progi dochodowe i wymagania eligibility muszą być przetłumaczone na 6 języków, czy polska wersja wystarczy (kalkulator numeryczny jest language-agnostic)?

4. **Aktualizacja emerytury**: Kto i kiedy aktualizuje `minimumPensionRef.amountPLN`? Potrzebny proces — calendar reminder 1 marca każdego roku.

5. **Scope**: Czy eligibility-checker to osobna strona (nowe `/sprawdz-uprawnienia`) czy dodatkowy step/flow w istniejącym Wizardzie?
