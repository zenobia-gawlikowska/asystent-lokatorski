import React, { useEffect, useState } from "react";

import { UI } from "@/data/ui";
import { tree } from "@/data/tree";
import { LANG_LABELS, LANGS, type Lang, type LocalizedString } from "@/data/types";
import { cn } from "@/lib/utils";

// KOPL contact page — update when the organization provides a direct link
const KOPL_CONTACT_URL = "https://lokatorzy.info.pl";

// BCP-47 lang codes for html[lang] — "ua" is our internal id, "uk" is the standard code for Ukrainian
const LANG_TO_BCP47: Record<Lang, string> = {
  pl: "pl",
  ua: "uk",
  ru: "ru",
  en: "en",
  es: "es",
  fr: "fr",
};

// ─── Types ──────────────────────────────────────────────────────────────────

type Step =
  | { id: "city" }
  | { id: "caseType"; cityId: string }
  | { id: "stage"; cityId: string; caseTypeId: string }
  | { id: "subType"; cityId: string; caseTypeId: string; stageId: string }
  | { id: "subStage"; cityId: string; caseTypeId: string; stageId: string; subTypeId: string }
  | { id: "result"; cityId: string; caseTypeId: string; stageId: string; subTypeId?: string; subStageId?: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

const t = (s: LocalizedString, lang: Lang) => s[lang];

// Steps in subType paths go up to 5; standard paths up to 3
function stepCount(step: Step): number {
  if (step.id === "subType" || step.id === "subStage") return 5;
  if (step.id === "result" && step.subTypeId) return 5;
  return 3;
}

function stepNumber(step: Step): number | null {
  if (step.id === "city") return 1;
  if (step.id === "caseType") return 2;
  if (step.id === "stage") return 3;
  if (step.id === "subType") return 4;
  if (step.id === "subStage") return 5;
  return null;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LanguageSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => {
            onChange(l);
          }}
          aria-pressed={l === lang}
          className={cn(
            "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-3 py-2 text-xs transition-colors focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none",
            l === lang
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white text-gray-600 hover:border-gray-500",
          )}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

function Tile({ label, description, onClick }: { label: string; description?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-900 hover:shadow-sm focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
    >
      <span className="block text-base font-semibold text-gray-900">{label}</span>
      {description && <span className="mt-1 block text-sm leading-relaxed text-gray-700">{description}</span>}
    </button>
  );
}

// ─── Wizard ─────────────────────────────────────────────────────────────────

export function Wizard() {
  const [lang, setLang] = useState<Lang>("pl");
  const [history, setHistory] = useState<Step[]>([{ id: "city" }]);

  // history is always non-empty (initialized with city step, never cleared to [])
  const step: Step = history[history.length - 1] ?? { id: "city" };

  // Persist language selection — must use useEffect to avoid SSR/hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("kopl-lang");
    if (saved && LANGS.includes(saved as Lang)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(saved as Lang);
      document.documentElement.lang = LANG_TO_BCP47[saved as Lang];
    }
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("kopl-lang", l);
    document.documentElement.lang = LANG_TO_BCP47[l];
  };

  const go = (next: Step) => {
    setHistory((h) => [...h, next]);
  };
  const back = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };
  const reset = () => {
    setHistory([{ id: "city" }]);
  };

  // Derive current objects from tree
  const city = step.id !== "city" ? tree.find((c) => c.id === step.cityId) : undefined;

  const caseType =
    (step.id === "stage" || step.id === "subType" || step.id === "subStage" || step.id === "result") && city
      ? city.caseTypes.find((ct) => ct.id === step.caseTypeId)
      : undefined;

  const stage =
    (step.id === "subType" || step.id === "subStage" || step.id === "result") && caseType
      ? caseType.stages.find((s) => s.id === step.stageId)
      : undefined;

  const subType =
    (step.id === "subStage" || step.id === "result") && stage && step.subTypeId
      ? stage.subTypes?.find((st) => st.id === step.subTypeId)
      : undefined;

  const subStage =
    step.id === "result" && subType && step.subStageId
      ? subType.stages.find((s) => s.id === step.subStageId)
      : undefined;

  // Documents come from the terminal stage (subStage if in subType path, otherwise stage)
  const resultStage = step.id === "result" ? (subStage ?? stage) : undefined;

  const stepNum = stepNumber(step);
  const STEP_COUNT = stepCount(step);

  // Dev-only a11y checker — tree-shaken by Vite in production builds
  useEffect(() => {
    if (import.meta.env.DEV) {
      void Promise.all([import("@axe-core/react"), import("react-dom")]).then(([{ default: axe }, ReactDOM]) => {
        void axe(React, ReactDOM, 1000);
      });
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/kopl-symbol.png" alt="KOPL" className="h-8 w-auto" />
              <h1 className="text-sm font-semibold text-gray-900">Asystent Lokatorski</h1>
            </div>
            {history.length > 1 && (
              <button
                onClick={back}
                className="-my-2 inline-flex min-h-[44px] items-center rounded-md px-2 py-2 text-sm text-gray-500 transition-colors hover:text-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                ← {t(UI.back, lang)}
              </button>
            )}
          </div>
          <LanguageSwitcher lang={lang} onChange={changeLang} />
          {stepNum !== null && (
            <div
              role="progressbar"
              aria-valuenow={stepNum}
              aria-valuemin={1}
              aria-valuemax={STEP_COUNT}
              aria-label={t(UI.progressLabel, lang)}
              className="h-1 w-full overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-[#d00000] transition-all duration-300"
                style={{ width: `${(stepNum / STEP_COUNT) * 100}%` }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Step 1 — City */}
          {step.id === "city" && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.selectCity, lang)}</h2>
              <div className="space-y-3">
                {tree.map((c) => (
                  <Tile
                    key={c.id}
                    label={c.name}
                    onClick={() => {
                      go({ id: "caseType", cityId: c.id });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 2 — Case type */}
          {step.id === "caseType" && city && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.selectCaseType, lang)}</h2>
              <div className="space-y-3">
                {city.caseTypes.map((ct) => (
                  <Tile
                    key={ct.id}
                    label={t(ct.label, lang)}
                    description={t(ct.description, lang)}
                    onClick={() => {
                      go({ id: "stage", cityId: step.cityId, caseTypeId: ct.id });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 3 — Stage */}
          {step.id === "stage" && caseType && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.selectStage, lang)}</h2>
              <div className="space-y-3">
                {caseType.stages.map((s) => (
                  <Tile
                    key={s.id}
                    label={t(s.label, lang)}
                    onClick={() => {
                      if (s.subTypes?.length) {
                        go({ id: "subType", cityId: step.cityId, caseTypeId: step.caseTypeId, stageId: s.id });
                      } else {
                        go({ id: "result", cityId: step.cityId, caseTypeId: step.caseTypeId, stageId: s.id });
                      }
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 4 — Sub-type (within a stage that branches further) */}
          {step.id === "subType" && stage && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.selectSubType, lang)}</h2>
              <div className="space-y-3">
                {stage.subTypes?.map((st) => (
                  <Tile
                    key={st.id}
                    label={t(st.label, lang)}
                    description={st.description ? t(st.description, lang) : undefined}
                    onClick={() => {
                      go({
                        id: "subStage",
                        cityId: step.cityId,
                        caseTypeId: step.caseTypeId,
                        stageId: step.stageId,
                        subTypeId: st.id,
                      });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 5 — Sub-stage */}
          {step.id === "subStage" && subType && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.selectStage, lang)}</h2>
              <div className="space-y-3">
                {subType.stages.map((s) => (
                  <Tile
                    key={s.id}
                    label={t(s.label, lang)}
                    onClick={() => {
                      go({
                        id: "result",
                        cityId: step.cityId,
                        caseTypeId: step.caseTypeId,
                        stageId: step.stageId,
                        subTypeId: step.subTypeId,
                        subStageId: s.id,
                      });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Result */}
          {step.id === "result" && resultStage && (
            <>
              <h2 className="text-xl font-bold text-gray-900">{t(UI.yourDocument, lang)}</h2>
              <div className="space-y-4">
                {(resultStage.documents ?? []).map((doc) => (
                  <div key={doc.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
                    <p className="font-semibold text-gray-900">{t(doc.name, lang)}</p>
                    {doc.note && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-amber-800 uppercase">
                          {t(UI.documentNote, lang)}
                        </p>
                        <p className="text-sm text-amber-900">{t(doc.note, lang)}</p>
                      </div>
                    )}
                    <a
                      href={doc.filename}
                      download
                      className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none"
                    >
                      {t(UI.download, lang)}
                    </a>
                  </div>
                ))}
              </div>
              <button
                onClick={reset}
                className="mt-2 min-h-[44px] w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {t(UI.startOver, lang)}
              </button>
            </>
          )}

          {/* Contact staff escape — FR-002, always visible */}
          <div className="border-t border-gray-100 pt-4 text-center">
            <a
              href={KOPL_CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="-mx-2 inline-flex min-h-[44px] items-center rounded-md px-2 py-2 text-sm text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t(UI.contactStaff, lang)}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
