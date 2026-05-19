import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./store";
import type { EntryTestResponse } from "./engine/entryTest";

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

describe("streak tracking", () => {
  beforeEach(() => useStore.getState().reset());

  it("starts streak at 0", () => {
    expect(useStore.getState().streak.current).toBe(0);
  });

  it("increments streak when recording an answer on a new day", () => {
    useStore.getState().recordAnswer("q1", ["bayes"], true);
    expect(useStore.getState().streak.current).toBe(1);
  });

  it("does not increment streak for multiple answers on the same day", () => {
    useStore.getState().recordAnswer("q1", ["bayes"], true);
    useStore.getState().recordAnswer("q2", ["bayes"], true);
    expect(useStore.getState().streak.current).toBe(1);
  });

  it("updates longest streak when current exceeds it", () => {
    useStore.getState().recordAnswer("q1", ["bayes"], true);
    expect(useStore.getState().streak.longest).toBe(1);
  });
});

describe("export/import", () => {
  beforeEach(() => useStore.getState().reset());

  it("exportState returns valid JSON string with current state", () => {
    useStore.getState().recordAnswer("q-a", ["bayes"], true);
    const json = useStore.getState().exportState();
    const parsed = JSON.parse(json);
    expect(parsed.skills.bayes).toBeGreaterThan(0.2);
    expect(parsed.history.length).toBe(1);
  });

  it("importState replaces current state with parsed JSON", () => {
    const state = {
      skills: { bayes: 0.95, clt: 0.5 },
      history: [],
      streak: { current: 7, longest: 7, lastDate: "2026-05-19" },
      preferences: { darkMode: true, soundEnabled: false },
    };
    useStore.getState().importState(JSON.stringify(state));
    expect(useStore.getState().skills.bayes).toBeCloseTo(0.95);
    expect(useStore.getState().streak.current).toBe(7);
  });

  it("importState throws on invalid JSON", () => {
    expect(() => useStore.getState().importState("not json")).toThrow();
  });

  it("importState throws on JSON missing required fields", () => {
    expect(() => useStore.getState().importState("{}")).toThrow(/skills|history/i);
  });
});

describe("applyEntryTest", () => {
  beforeEach(() => useStore.getState().reset());

  it("sets skill priors from entry test responses", () => {
    const responses: EntryTestResponse[] = [
      { skill: "bayes", correct: true },
      { skill: "bayes", correct: true },
    ];
    useStore.getState().applyEntryTest(responses);
    expect(useStore.getState().skills.bayes).toBeCloseTo(0.85, 5);
  });

  it("marks entry test as completed", () => {
    useStore.getState().applyEntryTest([]);
    expect(useStore.getState().entryTestCompleted).toBe(true);
  });
});
