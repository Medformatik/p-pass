import deskriptiv from "./bank/deskriptiv.json";
import wahrsch from "./bank/wahrsch.json";
import schliessend from "./bank/schliessend.json";
import { loadBank } from "./loader";
import type { Question } from "./types";

export const QUESTION_BANK: Map<string, Question> = loadBank([
  ...deskriptiv,
  ...wahrsch,
  ...schliessend,
]);

export function allQuestions(): Question[] {
  return Array.from(QUESTION_BANK.values());
}
