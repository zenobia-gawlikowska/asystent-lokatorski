export type Lang = "pl" | "ua" | "ru" | "en" | "es" | "fr";

export const LANGS: Lang[] = ["pl", "ua", "ru", "en", "es", "fr"];

export const LANG_LABELS: Record<Lang, string> = {
  pl: "Polski",
  ua: "Українська",
  ru: "Русский",
  en: "English",
  es: "Español",
  fr: "Français",
};

// All UI-visible strings are localized into all 6 supported languages.
// Documents themselves are always in Polish.
export type LocalizedString = Record<Lang, string>;

// Identifies who the document is addressed to, driving the icon badge in the result card
export type DocumentType =
  | "letter" // pismo do właściciela / zarządcy
  | "court" // wniosek / pozew / skarga do sądu
  | "police"; // doniesienie / zawiadomienie do organów ścigania

export interface Document {
  id: string;
  documentType: DocumentType;
  // Display name shown to tenant in their language
  name: LocalizedString;
  // Path under /public/documents/, always a Polish-language file
  filename: string;
  // Short description of what the document does and when to use it
  description?: LocalizedString;
  // Optional guidance on when / how to use this document
  note?: LocalizedString;
}

export interface SubType {
  id: string;
  label: LocalizedString;
  description?: LocalizedString;
  stages: Stage[];
}

export interface Stage {
  id: string;
  label: LocalizedString;
  // Either documents (terminal) or subTypes (one more level of navigation)
  documents?: Document[];
  subTypes?: SubType[];
}

export interface CaseType {
  id: string;
  // Short label shown on the tile
  label: LocalizedString;
  // Longer description that helps the tenant recognize their situation (FR-001)
  description: LocalizedString;
  stages: Stage[];
}

export interface City {
  id: string;
  // Proper noun — displayed as-is in all languages
  name: string;
  caseTypes: CaseType[];
}

export type DecisionTree = City[];

// ─── Wizard navigation ───────────────────────────────────────────────────────

// Each Step represents the current screen in the wizard.
// The history stack (Step[]) is always non-empty; the last element is active.
export type Step =
  | { id: "caseType" }
  | { id: "stage"; caseTypeId: string }
  | { id: "subType"; caseTypeId: string; stageId: string }
  | { id: "subStage"; caseTypeId: string; stageId: string; subTypeId: string }
  | { id: "result"; caseTypeId: string; stageId: string; subTypeId?: string; subStageId?: string };
