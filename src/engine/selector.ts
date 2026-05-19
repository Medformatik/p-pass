import type { Question } from "@/questions/types";
import type { SkillId } from "./skills";

const RECENCY_WINDOW = 20;
const RECENCY_PENALTY = 0.5;

export function pickNextQuestion(
  bank: Question[],
  skills: Record<SkillId, number>,
  recentIds: string[],
): Question | undefined {
  if (bank.length === 0) return undefined;

  const recencySet = new Set(recentIds.slice(-RECENCY_WINDOW));

  function score(q: Question): number {
    const weaknesses = q.skills.map((sid) => 1 - (skills[sid] ?? 0.5));
    const weakness = weaknesses.reduce((a, b) => a + b, 0) / Math.max(weaknesses.length, 1);
    const recency = recencySet.has(q.id) ? RECENCY_PENALTY : 0;
    return weakness - recency;
  }

  let best: Question | undefined;
  let bestScore = -Infinity;
  for (const q of bank) {
    const s = score(q);
    if (s > bestScore) {
      bestScore = s;
      best = q;
    }
  }

  // Garantie: niemals eine kürzlich gesehene Frage wählen, solange es Alternativen gibt.
  // (Recency-Penalty allein reicht nicht, wenn der Weakness-Vorteil größer ist.)
  if (best && recencySet.has(best.id) && bank.length > recencySet.size) {
    for (const q of bank) {
      if (!recencySet.has(q.id)) {
        return q;
      }
    }
  }

  return best;
}
