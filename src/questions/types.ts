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

export type MCPart = {
  type: "mc";
  label: string;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type NumericPart = {
  type: "numeric";
  label: string;
  stem: string;
  correct: { value: number; tolerance: number };
  explanation: string;
};

export type QuestionPart = MCPart | NumericPart;

export type MultiPartQuestion = {
  id: string;
  type: "multi-part";
  skills: SkillId[];
  difficulty: number;
  stem: string;
  parts: QuestionPart[];
  explanation: string;
  viz?: VizSpec;
  source?: string;
};

export type Question =
  | MCQuestion
  | MultiMCQuestion
  | NumericQuestion
  | MultiPartQuestion;
