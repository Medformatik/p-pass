import { describe, it, expect } from "vitest";
import { bktUpdate, clampPL } from "./bkt";
import { DEFAULT_BKT_PARAMS } from "./skills";

describe("clampPL", () => {
  it("clamps below 0.001 to 0.001", () => {
    expect(clampPL(0)).toBeCloseTo(0.001);
    expect(clampPL(-0.5)).toBeCloseTo(0.001);
  });
  it("clamps above 0.999 to 0.999", () => {
    expect(clampPL(1)).toBeCloseTo(0.999);
    expect(clampPL(1.5)).toBeCloseTo(0.999);
  });
  it("leaves middle values untouched", () => {
    expect(clampPL(0.5)).toBe(0.5);
  });
});

describe("bktUpdate (correct observation)", () => {
  it("increases P(L) when answer is correct", () => {
    const next = bktUpdate(0.3, true, DEFAULT_BKT_PARAMS);
    expect(next).toBeGreaterThan(0.3);
  });
  it("approaches 1 with many corrects", () => {
    let pL = 0.2;
    for (let i = 0; i < 30; i++) pL = bktUpdate(pL, true, DEFAULT_BKT_PARAMS);
    expect(pL).toBeGreaterThan(0.95);
  });
});

describe("bktUpdate (incorrect observation)", () => {
  it("decreases P(L) when answer is wrong (after small learning bump)", () => {
    const next = bktUpdate(0.9, false, DEFAULT_BKT_PARAMS);
    expect(next).toBeLessThan(0.9);
  });
});

describe("bktUpdate (stability)", () => {
  it("never reaches exactly 0 or 1 (clamping)", () => {
    let pL = 0.5;
    for (let i = 0; i < 1000; i++) pL = bktUpdate(pL, true, DEFAULT_BKT_PARAMS);
    expect(pL).toBeLessThan(1);
    expect(pL).toBeGreaterThan(0);
  });
});

import { bktPredict, bktUpdateMulti } from "./bkt";

describe("bktPredict", () => {
  it("returns probability of next correct given P(L)", () => {
    const p = bktPredict(0.8, DEFAULT_BKT_PARAMS);
    // P = 0.8 * (1 - 0.1) + 0.2 * 0.2 = 0.72 + 0.04 = 0.76
    expect(p).toBeCloseTo(0.76, 10);
  });
  it("predicts ~pG when P(L) ≈ 0", () => {
    const p = bktPredict(0.001, DEFAULT_BKT_PARAMS);
    expect(p).toBeCloseTo(0.2, 2);
  });
  it("predicts ~(1-pS) when P(L) ≈ 1", () => {
    const p = bktPredict(0.999, DEFAULT_BKT_PARAMS);
    expect(p).toBeCloseTo(0.9, 2);
  });
});

describe("bktUpdateMulti", () => {
  it("updates primary with full T, secondary with halved T", () => {
    const initial = { bayes: 0.4, bedingt: 0.4 };
    const next = bktUpdateMulti(initial, ["bayes", "bedingt"], true, DEFAULT_BKT_PARAMS);
    expect(next.bayes).toBeGreaterThan(initial.bayes);
    expect(next.bedingt).toBeGreaterThan(initial.bedingt);
    // primary should have moved more
    expect(next.bayes - initial.bayes).toBeGreaterThan(next.bedingt - initial.bedingt);
  });
  it("leaves untouched skills unchanged", () => {
    const initial: Record<"bayes" | "normal", number> = { bayes: 0.4, normal: 0.5 };
    const skills: ("bayes" | "normal")[] = ["bayes"];
    const next = bktUpdateMulti(initial, skills, true, DEFAULT_BKT_PARAMS);
    expect(next.normal).toBe(0.5);
  });
});
