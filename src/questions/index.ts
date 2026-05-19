import seed from "./bank/seed.json";
import { loadBank } from "./loader";
import type { Question } from "./types";

export const QUESTION_BANK: Map<string, Question> = loadBank(seed);

export function allQuestions(): Question[] {
  return Array.from(QUESTION_BANK.values());
}
