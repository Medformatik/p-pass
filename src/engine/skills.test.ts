import { describe, it, expect } from "vitest";
import { SKILLS, getSkill, DEFAULT_BKT_PARAMS } from "./skills";

describe("skills taxonomy", () => {
  it("contains exactly 20 skills", () => {
    expect(SKILLS.length).toBe(20);
  });
  it("every skill has unique id", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("every skill belongs to one of 3 blocks", () => {
    const validBlocks = new Set(["deskriptiv", "wahrsch", "schliessend"]);
    for (const s of SKILLS) expect(validBlocks.has(s.block)).toBe(true);
  });
  it("getSkill returns the skill by id", () => {
    expect(getSkill("bayes").label).toMatch(/Bayes/);
  });
  it("getSkill throws for unknown id", () => {
    // @ts-expect-error testing runtime behavior
    expect(() => getSkill("nonexistent")).toThrow();
  });
  it("default BKT params are sensible", () => {
    const p = DEFAULT_BKT_PARAMS;
    expect(p.pL0).toBeGreaterThan(0);
    expect(p.pL0).toBeLessThan(1);
    expect(p.pG + p.pS).toBeLessThan(1);
  });
});
