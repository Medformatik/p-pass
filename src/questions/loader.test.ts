import { describe, it, expect } from "vitest";
import { validateQuestion, loadBank } from "./loader";

const validMC = {
  id: "q-bayes-001",
  type: "mc",
  skills: ["bayes"],
  difficulty: 0.4,
  stem: "Was ist Bayes?",
  options: ["a", "b", "c", "d"],
  correct: 1,
  explanation: "Weil...",
};

describe("validateQuestion", () => {
  it("accepts valid MC", () => {
    expect(() => validateQuestion(validMC)).not.toThrow();
  });
  it("rejects unknown skill id", () => {
    expect(() => validateQuestion({ ...validMC, skills: ["nonsense"] })).toThrow(/skill/i);
  });
  it("rejects MC with correct index out of range", () => {
    expect(() => validateQuestion({ ...validMC, correct: 7 })).toThrow(/correct/i);
  });
  it("rejects difficulty > 1", () => {
    expect(() => validateQuestion({ ...validMC, difficulty: 1.5 })).toThrow(/difficulty/i);
  });
  it("rejects empty options for MC", () => {
    expect(() => validateQuestion({ ...validMC, options: [] })).toThrow(/options/i);
  });
});

describe("loadBank", () => {
  it("returns map of valid questions", () => {
    const bank = loadBank([validMC]);
    expect(bank.size).toBe(1);
    expect(bank.get("q-bayes-001")?.stem).toBe("Was ist Bayes?");
  });
  it("throws on duplicate ids", () => {
    expect(() => loadBank([validMC, { ...validMC }])).toThrow(/duplicate/i);
  });
});

import { QUESTION_BANK } from "./index";

describe("question bank", () => {
  it("loads all bank questions without validation errors", () => {
    expect(QUESTION_BANK.size).toBeGreaterThanOrEqual(60);
  });
});
