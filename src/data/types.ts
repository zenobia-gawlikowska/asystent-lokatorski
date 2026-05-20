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

export interface Document {
  id: string;
  // Display name shown to tenant in their language
  name: LocalizedString;
  // Path under /public/documents/, always a Polish-language file
  filename: string;
  // Optional guidance on when / how to use this document
  note?: LocalizedString;
}

export interface Stage {
  id: string;
  label: LocalizedString;
  documents: Document[];
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
