import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./store";

describe("store", () => {
  beforeEach(() => {
    useStore.getState().reset();
  });

  it("initializes with default pL for all skills", () => {
    const { skills } = useStore.getState();
    expect(skills.bayes).toBeCloseTo(0.2, 5);
    expect(skills.clt).toBeCloseTo(0.2, 5);
  });

  it("recordAnswer updates pL for involved skills", () => {
    const before = useStore.getState().skills.bayes;
    useStore.getState().recordAnswer("q-test", ["bayes"], true);
    const after = useStore.getState().skills.bayes;
    expect(after).toBeGreaterThan(before);
  });

  it("recordAnswer adds history entry", () => {
    useStore.getState().recordAnswer("q-test", ["bayes"], false);
    const history = useStore.getState().history;
    expect(history.length).toBe(1);
    expect(history[0].qid).toBe("q-test");
    expect(history[0].correct).toBe(false);
  });

  it("history is capped at 1000 entries", () => {
    const s = useStore.getState();
    for (let i = 0; i < 1010; i++) s.recordAnswer(`q-${i}`, ["bayes"], true);
    expect(useStore.getState().history.length).toBe(1000);
  });
});
