import type { CaseType, City, Stage, Step, SubType } from "@/data/types";

// ─── Progress bar helpers ────────────────────────────────────────────────────

// Standard path: 3 steps (caseType→stage→result). Extended (subType): 5 steps.
// Result is included so the bar reaches 100% on completion.
export function stepCount(step: Step): number {
  if (step.id === "subType" || step.id === "subStage") return 5;
  if (step.id === "result" && step.subTypeId) return 5;
  return 3;
}

export function stepNumber(step: Step): number {
  if (step.id === "caseType") return 1;
  if (step.id === "stage") return 2;
  if (step.id === "subType") return 3;
  if (step.id === "subStage") return 4;
  // result: end of path — full bar
  return step.subTypeId ? 5 : 3;
}

// ─── History stack operations ────────────────────────────────────────────────

export function appendStep(history: Step[], next: Step): Step[] {
  return [...history, next];
}

// Guard: if history has only one entry, do not pop (stay on first screen).
export function popStep(history: Step[]): Step[] {
  return history.length > 1 ? history.slice(0, -1) : history;
}

export function resetSteps(): Step[] {
  return [{ id: "caseType" }];
}

// ─── Tree derivation ─────────────────────────────────────────────────────────

export interface WizardNodes {
  caseType: CaseType | undefined;
  stage: Stage | undefined;
  subType: SubType | undefined;
  subStage: Stage | undefined;
  resultStage: Stage | undefined;
}

// Replicates the inline derivation from Wizard.tsx — pure, no side-effects.
export function deriveWizardNodes(step: Step, city: City | undefined): WizardNodes {
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

  const resultStage = step.id === "result" ? (subStage ?? stage) : undefined;

  return { caseType, stage, subType, subStage, resultStage };
}
