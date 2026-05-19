import type { BKTParams } from "./skills";

const PL_MIN = 0.001;
const PL_MAX = 0.999;

export function clampPL(pL: number): number {
  if (pL < PL_MIN) return PL_MIN;
  if (pL > PL_MAX) return PL_MAX;
  return pL;
}

/**
 * BKT-Update: Posterior P(L|obs) → Lerntransition.
 */
export function bktUpdate(pL: number, correct: boolean, params: BKTParams): number {
  const { pT, pG, pS } = params;
  const pLClamped = clampPL(pL);

  let posterior: number;
  if (correct) {
    const num = pLClamped * (1 - pS);
    const denom = num + (1 - pLClamped) * pG;
    posterior = num / denom;
  } else {
    const num = pLClamped * pS;
    const denom = num + (1 - pLClamped) * (1 - pG);
    posterior = num / denom;
  }

  const learned = posterior + (1 - posterior) * pT;
  return clampPL(learned);
}

export function bktPredict(pL: number, params: BKTParams): number {
  const p = clampPL(pL);
  return p * (1 - params.pS) + (1 - p) * params.pG;
}

/**
 * Aktualisiert mehrere Skills nach einer Beobachtung.
 * Erster Skill = primär (volles pT), restliche = sekundär (halbiertes pT).
 */
export function bktUpdateMulti<K extends string>(
  current: Record<K, number>,
  skills: K[],
  correct: boolean,
  params: BKTParams,
): Record<K, number> {
  const next = { ...current };
  for (let i = 0; i < skills.length; i++) {
    const sid = skills[i];
    if (!(sid in next)) continue;
    const effectiveParams = i === 0 ? params : { ...params, pT: params.pT * 0.5 };
    next[sid] = bktUpdate(next[sid], correct, effectiveParams);
  }
  return next;
}
