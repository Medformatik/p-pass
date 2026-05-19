import type { SkillId } from "@/engine/skills";

export type VizSpec = {
  component: string;
  props: Record<string, unknown>;
};

export type MCQuestion = {
  id: string;
  type: "mc";
  skills: SkillId[];
  difficulty: number;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
  solutionSteps?: string[];
  viz?: VizSpec;
  source?: string;
};

export type MultiMCQuestion = {
  id: string;
  type: "multi-mc";
  skills: SkillId[];
  difficulty: number;
  stem: string;
  options: string[];
  correct: number[];
  explanation: string;
  solutionSteps?: string[];
  viz?: VizSpec;
  source?: string;
};

export type NumericQuestion = {
  id: string;
  type: "numeric";
  skills: SkillId[];
  difficulty: number;
  stem: string;
  correct: { value: number; tolerance: number };
  explanation: string;
  solutionSteps?: string[];
  viz?: VizSpec;
  source?: string;
};

export type Question = MCQuestion | MultiMCQuestion | NumericQuestion;
