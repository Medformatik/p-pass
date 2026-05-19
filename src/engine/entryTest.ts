import { SKILLS, type SkillId } from "./skills";

export type EntryTestResponse = {
  skill: SkillId;
  correct: boolean;
};

const MIN_P = 0.1;
const MAX_P = 0.85;

export function computeEntryTestPriors(
  responses: EntryTestResponse[],
): Record<SkillId, number> {
  const counts: Record<string, { correct: number; total: number }> = {};
  for (const r of responses) {
    if (!counts[r.skill]) counts[r.skill] = { correct: 0, total: 0 };
    counts[r.skill].total += 1;
    if (r.correct) counts[r.skill].correct += 1;
  }

  const result = {} as Record<SkillId, number>;
  for (const skill of SKILLS) {
    const c = counts[skill.id];
    if (!c || c.total === 0) {
      result[skill.id] = skill.bktParams.pL0;
    } else {
      const raw = 0.15 + 0.7 * (c.correct / c.total);
      result[skill.id] = Math.max(MIN_P, Math.min(MAX_P, raw));
    }
  }
  return result;
}
