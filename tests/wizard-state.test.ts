import { describe, expect, it } from "vitest";

import type { City, Step } from "@/data/types";
import { appendStep, deriveWizardNodes, popStep, resetSteps, stepCount, stepNumber } from "@/lib/wizard-state";

// ─── stepCount ───────────────────────────────────────────────────────────────

describe("stepCount", () => {
  it("returns 3 for caseType step", () => {
    expect(stepCount({ id: "caseType" })).toBe(3);
  });

  it("returns 3 for stage step", () => {
    expect(stepCount({ id: "stage", caseTypeId: "ct1" })).toBe(3);
  });

  it("returns 5 for subType step", () => {
    expect(stepCount({ id: "subType", caseTypeId: "ct1", stageId: "s1" })).toBe(5);
  });

  it("returns 5 for subStage step", () => {
    expect(stepCount({ id: "subStage", caseTypeId: "ct1", stageId: "s1", subTypeId: "st1" })).toBe(5);
  });

  it("returns 5 for result step with subTypeId (extended path)", () => {
    expect(stepCount({ id: "result", caseTypeId: "ct1", stageId: "s1", subTypeId: "st1" })).toBe(5);
  });

  it("returns 3 for result step without subTypeId (standard path)", () => {
    expect(stepCount({ id: "result", caseTypeId: "ct1", stageId: "s1" })).toBe(3);
  });
});

// ─── stepNumber ──────────────────────────────────────────────────────────────

describe("stepNumber", () => {
  it("returns 1 for caseType step", () => {
    expect(stepNumber({ id: "caseType" })).toBe(1);
  });

  it("returns 2 for stage step", () => {
    expect(stepNumber({ id: "stage", caseTypeId: "ct1" })).toBe(2);
  });

  it("returns 3 for subType step", () => {
    expect(stepNumber({ id: "subType", caseTypeId: "ct1", stageId: "s1" })).toBe(3);
  });

  it("returns 4 for subStage step", () => {
    expect(stepNumber({ id: "subStage", caseTypeId: "ct1", stageId: "s1", subTypeId: "st1" })).toBe(4);
  });

  it("returns 5 for result step with subTypeId (extended path)", () => {
    expect(stepNumber({ id: "result", caseTypeId: "ct1", stageId: "s1", subTypeId: "st1" })).toBe(5);
  });

  it("returns 3 for result step without subTypeId (standard path)", () => {
    expect(stepNumber({ id: "result", caseTypeId: "ct1", stageId: "s1" })).toBe(3);
  });
});

// ─── appendStep ──────────────────────────────────────────────────────────────

describe("appendStep", () => {
  it("appends the new step to the end of history", () => {
    const history: Step[] = [{ id: "caseType" }];
    const next: Step = { id: "stage", caseTypeId: "ct1" };
    const result = appendStep(history, next);
    expect(result).toEqual([{ id: "caseType" }, { id: "stage", caseTypeId: "ct1" }]);
  });

  it("does not mutate the original history array", () => {
    const history: Step[] = [{ id: "caseType" }];
    const next: Step = { id: "stage", caseTypeId: "ct1" };
    appendStep(history, next);
    expect(history).toEqual([{ id: "caseType" }]);
  });

  it("returns a new array reference", () => {
    const history: Step[] = [{ id: "caseType" }];
    const next: Step = { id: "stage", caseTypeId: "ct1" };
    const result = appendStep(history, next);
    expect(result).not.toBe(history);
  });
});

// ─── popStep ─────────────────────────────────────────────────────────────────

describe("popStep", () => {
  it("removes the last step when history has more than one entry", () => {
    const history: Step[] = [{ id: "caseType" }, { id: "stage", caseTypeId: "ct1" }];
    const result = popStep(history);
    expect(result).toEqual([{ id: "caseType" }]);
  });

  it("returns the same history (no pop) when history has exactly one entry", () => {
    const history: Step[] = [{ id: "caseType" }];
    const result = popStep(history);
    expect(result).toEqual([{ id: "caseType" }]);
  });

  it("does not mutate the original history array", () => {
    const history: Step[] = [{ id: "caseType" }, { id: "stage", caseTypeId: "ct1" }];
    popStep(history);
    expect(history).toHaveLength(2);
  });

  it("returns a new array reference when popping", () => {
    const history: Step[] = [{ id: "caseType" }, { id: "stage", caseTypeId: "ct1" }];
    const result = popStep(history);
    expect(result).not.toBe(history);
  });
});

// ─── resetSteps ──────────────────────────────────────────────────────────────

describe("resetSteps", () => {
  it("returns a history with a single caseType step", () => {
    expect(resetSteps()).toEqual([{ id: "caseType" }]);
  });

  it("returns a new array on every call (no singleton)", () => {
    const a = resetSteps();
    const b = resetSteps();
    expect(a).not.toBe(b);
  });
});

// ─── deriveWizardNodes ───────────────────────────────────────────────────────

// Minimal fixture tree — one city, one caseType, one stage with subTypes, one subType with one subStage
const STAGE_PLAIN: City["caseTypes"][number]["stages"][number] = {
  id: "s-plain",
  label: { pl: "Zwykły", ua: "", ru: "", en: "", es: "", fr: "" },
  documents: [
    {
      id: "doc1",
      documentType: "letter",
      name: { pl: "Pismo", ua: "", ru: "", en: "", es: "", fr: "" },
      filename: "/docs/pismo.pdf",
    },
  ],
};

const SUB_STAGE: City["caseTypes"][number]["stages"][number] = {
  id: "ss1",
  label: { pl: "Podstadium", ua: "", ru: "", en: "", es: "", fr: "" },
  documents: [
    {
      id: "doc2",
      documentType: "court",
      name: { pl: "Pozew", ua: "", ru: "", en: "", es: "", fr: "" },
      filename: "/docs/pozew.pdf",
    },
  ],
};

const SUB_TYPE: NonNullable<City["caseTypes"][number]["stages"][number]["subTypes"]>[number] = {
  id: "st1",
  label: { pl: "Podtyp", ua: "", ru: "", en: "", es: "", fr: "" },
  stages: [SUB_STAGE],
};

const STAGE_WITH_SUBTYPES: City["caseTypes"][number]["stages"][number] = {
  id: "s-ext",
  label: { pl: "Rozbudowany", ua: "", ru: "", en: "", es: "", fr: "" },
  subTypes: [SUB_TYPE],
};

const CASE_TYPE: City["caseTypes"][number] = {
  id: "ct1",
  label: { pl: "Typ sprawy", ua: "", ru: "", en: "", es: "", fr: "" },
  description: { pl: "Opis", ua: "", ru: "", en: "", es: "", fr: "" },
  stages: [STAGE_PLAIN, STAGE_WITH_SUBTYPES],
};

const CITY: City = {
  id: "warszawa",
  name: "Warszawa",
  caseTypes: [CASE_TYPE],
};

describe("deriveWizardNodes", () => {
  it("returns all undefined on caseType step", () => {
    const result = deriveWizardNodes({ id: "caseType" }, CITY);
    expect(result.caseType).toBeUndefined();
    expect(result.stage).toBeUndefined();
    expect(result.subType).toBeUndefined();
    expect(result.subStage).toBeUndefined();
    expect(result.resultStage).toBeUndefined();
  });

  it("returns caseType on stage step, rest undefined", () => {
    const result = deriveWizardNodes({ id: "stage", caseTypeId: "ct1" }, CITY);
    expect(result.caseType?.id).toBe("ct1");
    expect(result.stage).toBeUndefined();
    expect(result.subType).toBeUndefined();
    expect(result.resultStage).toBeUndefined();
  });

  it("returns caseType + stage on result step (standard path)", () => {
    const result = deriveWizardNodes({ id: "result", caseTypeId: "ct1", stageId: "s-plain" }, CITY);
    expect(result.caseType?.id).toBe("ct1");
    expect(result.stage?.id).toBe("s-plain");
    expect(result.subType).toBeUndefined();
    expect(result.subStage).toBeUndefined();
    expect(result.resultStage?.id).toBe("s-plain");
  });

  it("resultStage equals stage on standard path", () => {
    const result = deriveWizardNodes({ id: "result", caseTypeId: "ct1", stageId: "s-plain" }, CITY);
    expect(result.resultStage).toBe(result.stage);
  });

  it("returns all nodes on result step (extended path with subTypeId + subStageId)", () => {
    const result = deriveWizardNodes(
      { id: "result", caseTypeId: "ct1", stageId: "s-ext", subTypeId: "st1", subStageId: "ss1" },
      CITY,
    );
    expect(result.caseType?.id).toBe("ct1");
    expect(result.stage?.id).toBe("s-ext");
    expect(result.subType?.id).toBe("st1");
    expect(result.subStage?.id).toBe("ss1");
    expect(result.resultStage?.id).toBe("ss1");
  });

  it("resultStage equals subStage on extended path", () => {
    const result = deriveWizardNodes(
      { id: "result", caseTypeId: "ct1", stageId: "s-ext", subTypeId: "st1", subStageId: "ss1" },
      CITY,
    );
    expect(result.resultStage).toBe(result.subStage);
  });

  it("returns undefined caseType for unknown caseTypeId", () => {
    const result = deriveWizardNodes({ id: "stage", caseTypeId: "unknown" }, CITY);
    expect(result.caseType).toBeUndefined();
  });

  it("returns all undefined when city is undefined", () => {
    const result = deriveWizardNodes({ id: "stage", caseTypeId: "ct1" }, undefined);
    expect(result.caseType).toBeUndefined();
    expect(result.stage).toBeUndefined();
    expect(result.resultStage).toBeUndefined();
  });
});
