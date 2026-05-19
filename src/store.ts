import { create } from "zustand";
import { SKILLS, DEFAULT_BKT_PARAMS, type SkillId } from "@/engine/skills";
import { bktUpdateMulti } from "@/engine/bkt";
import { computeDiagnosticPriors, type DiagnosticResponse } from "@/engine/diagnose";

const HISTORY_CAP = 1000;
const STORAGE_KEY = "ppass:v1:state";

export type HistoryEntry = {
  qid: string;
  skills: SkillId[];
  correct: boolean;
  timestamp: string;
  pLBefore: Record<SkillId, number>;
  pLAfter: Record<SkillId, number>;
};

export type StoreState = {
  skills: Record<SkillId, number>;
  history: HistoryEntry[];
  streak: { current: number; longest: number; lastDate: string };
  preferences: { darkMode: boolean; soundEnabled: boolean };
  diagnosticCompleted: boolean;
};

export type StoreActions = {
  recordAnswer: (qid: string, skills: SkillId[], correct: boolean) => void;
  reset: () => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  exportState: () => string;
  importState: (json: string) => void;
  applyDiagnostic: (responses: DiagnosticResponse[]) => void;
};

function initialSkills(): Record<SkillId, number> {
  const obj = {} as Record<SkillId, number>;
  for (const s of SKILLS) obj[s.id] = s.bktParams.pL0;
  return obj;
}

const initialState: StoreState = {
  skills: initialSkills(),
  history: [],
  streak: { current: 0, longest: 0, lastDate: "" },
  preferences: { darkMode: true, soundEnabled: false },
  diagnosticCompleted: false,
};

function loadPersisted(): StoreState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as StoreState;
    return {
      ...initialState,
      ...parsed,
      skills: { ...initialState.skills, ...parsed.skills },
      preferences: { ...initialState.preferences, ...parsed.preferences },
    };
  } catch {
    return initialState;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(state: StoreState) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / disabled storage
    }
  }, 500);
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextStreak(
  current: { current: number; longest: number; lastDate: string },
  today: string,
): { current: number; longest: number; lastDate: string } {
  if (current.lastDate === today) return current;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newCurrent = current.lastDate === yesterday ? current.current + 1 : 1;
  return {
    current: newCurrent,
    longest: Math.max(newCurrent, current.longest),
    lastDate: today,
  };
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  ...loadPersisted(),
  recordAnswer(qid, skills, correct) {
    const before = get().skills;
    const after = bktUpdateMulti(before, skills, correct, DEFAULT_BKT_PARAMS);
    const entry: HistoryEntry = {
      qid,
      skills,
      correct,
      timestamp: new Date().toISOString(),
      pLBefore: before,
      pLAfter: after,
    };
    set((state) => {
      const newHistory = [...state.history, entry];
      while (newHistory.length > HISTORY_CAP) newHistory.shift();
      const newStreak = nextStreak(state.streak, todayISODate());
      const next = {
        ...state,
        skills: after,
        history: newHistory,
        streak: newStreak,
      };
      persist(next);
      return next;
    });
  },
  reset() {
    set(() => {
      persist(initialState);
      return initialState;
    });
  },
  toggleDarkMode() {
    set((state) => {
      const next = {
        ...state,
        preferences: { ...state.preferences, darkMode: !state.preferences.darkMode },
      };
      persist(next);
      return next;
    });
  },
  toggleSound() {
    set((state) => {
      const next = {
        ...state,
        preferences: { ...state.preferences, soundEnabled: !state.preferences.soundEnabled },
      };
      persist(next);
      return next;
    });
  },
  exportState() {
    const s = get();
    return JSON.stringify(
      {
        skills: s.skills,
        history: s.history,
        streak: s.streak,
        preferences: s.preferences,
      },
      null,
      2,
    );
  },
  importState(json) {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    if (!parsed.skills || typeof parsed.skills !== "object")
      throw new Error("missing or invalid skills");
    if (!Array.isArray(parsed.history)) throw new Error("missing or invalid history");
    set((state) => {
      const next: StoreState = {
        ...state,
        skills: { ...state.skills, ...parsed.skills },
        history: parsed.history,
        streak: parsed.streak ?? state.streak,
        preferences: { ...state.preferences, ...(parsed.preferences ?? {}) },
      };
      persist(next);
      return next;
    });
  },
  applyDiagnostic(responses) {
    const priors = computeDiagnosticPriors(responses);
    set((state) => {
      const next = { ...state, skills: priors, diagnosticCompleted: true };
      persist(next);
      return next;
    });
  },
}));
