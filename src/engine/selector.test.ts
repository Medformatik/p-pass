import { describe, it, expect } from "vitest";
import { pickNextQuestion } from "./selector";
import type { Question } from "@/questions/types";
import type { SkillId } from "./skills";

const sampleBank: Question[] = [
  {
    id: "q1",
    type: "mc",
    skills: ["bayes"],
    difficulty: 0.5,
    stem: "q1",
    options: ["a", "b"],
    correct: 0,
    explanation: "",
  },
  {
    id: "q2",
    type: "mc",
    skills: ["clt"],
    difficulty: 0.5,
    stem: "q2",
    options: ["a", "b"],
    correct: 0,
    explanation: "",
  },
];

describe("pickNextQuestion", () => {
  it("prefers questions targeting weaker skills", () => {
    const skills = { bayes: 0.2, clt: 0.9 } as Record<string, number>;
    const next = pickNextQuestion(sampleBank, skills as Record<SkillId, number>, []);
    expect(next?.id).toBe("q1");
  });

  it("respects recency — does not pick a recently-seen question", () => {
    const skills = { bayes: 0.2, clt: 0.9 } as Record<string, number>;
    const recent = ["q1"];
    const next = pickNextQuestion(sampleBank, skills as Record<SkillId, number>, recent);
    expect(next?.id).toBe("q2");
  });

  it("returns undefined on empty bank", () => {
    expect(pickNextQuestion([], {} as Record<SkillId, number>, [])).toBeUndefined();
  });

  it("allows previously-seen question when no alternatives", () => {
    const skills = { bayes: 0.2 } as Record<string, number>;
    const single: Question[] = [sampleBank[0]];
    const next = pickNextQuestion(single, skills as Record<SkillId, number>, ["q1"]);
    expect(next?.id).toBe("q1");
  });
});
