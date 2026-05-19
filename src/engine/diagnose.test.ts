import { describe, it, expect } from "vitest";
import { computeDiagnosticPriors } from "./diagnose";
import { SKILLS } from "./skills";

describe("computeDiagnosticPriors", () => {
  it("returns defaults (pL0) for skills not in diagnostic results", () => {
    const priors = computeDiagnosticPriors([]);
    expect(priors.bayes).toBeCloseTo(0.2, 5);
    expect(priors.clt).toBeCloseTo(0.2, 5);
  });

  it("raises pL for a skill where all answers were correct", () => {
    const priors = computeDiagnosticPriors([
      { skill: "bayes", correct: true },
      { skill: "bayes", correct: true },
    ]);
    expect(priors.bayes).toBeCloseTo(0.85, 5);
  });

  it("lowers pL for a skill where all answers were wrong", () => {
    const priors = computeDiagnosticPriors([
      { skill: "bayes", correct: false },
      { skill: "bayes", correct: false },
    ]);
    expect(priors.bayes).toBeCloseTo(0.15, 5);
  });

  it("uses proportion correct for mixed results", () => {
    const priors = computeDiagnosticPriors([
      { skill: "clt", correct: true },
      { skill: "clt", correct: false },
    ]);
    expect(priors.clt).toBeCloseTo(0.5, 5);
  });

  it("includes all 20 skills in result", () => {
    const priors = computeDiagnosticPriors([]);
    for (const s of SKILLS) {
      expect(priors[s.id]).toBeDefined();
    }
  });
});
