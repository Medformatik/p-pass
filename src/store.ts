import { create } from "zustand";
import { SKILLS, getSkill, type SkillId } from "@/engine/skills";
import { bktUpdateMulti } from "@/engine/bkt";
import { computeEntryTestPriors, type EntryTestResponse } from "@/engine/entryTest";

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

export type ThemeMode = "system" | "light" | "dark";

export type StoreState = {
  skills: Record<SkillId, number>;
  history: HistoryEntry[];
  streak: { current: number; longest: number; lastDate: string };
  preferences: { theme: ThemeMode; soundEnabled: boolean };
  entryTestCompleted: boolean;
};

export type StoreActions = {
  recordAnswer: (qid: string, skills: SkillId[], correct: boolean) => void;
  reset: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSound: () => void;
  exportState: () => string;
  importState: (json: string) => void;
  applyEntryTest: (responses: EntryTestResponse[]) => void;
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
  preferences: { theme: "system", soundEnabled: false },
  entryTestCompleted: false,
};

function loadPersisted(): StoreState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<StoreState> & {
      preferences?: { darkMode?: boolean; theme?: ThemeMode; soundEnabled?: boolean };
    };
    // Migrate legacy darkMode → theme
    const legacy = parsed.preferences;
    const migratedTheme: ThemeMode =
      legacy?.theme ?? (typeof legacy?.darkMode === "boolean" ? (legacy.darkMode ? "dark" : "light") : "system");
    const migratedPreferences = {
      theme: migratedTheme,
      soundEnabled: legacy?.soundEnabled ?? initialState.preferences.soundEnabled,
    };
    return {
      ...initialState,
      ...parsed,
      skills: { ...initialState.skills, ...parsed.skills },
      preferences: migratedPreferences,
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
    const after = bktUpdateMulti(before, skills, correct, (sid) => getSkill(sid).bktParams);
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
  setTheme(theme) {
    set((state) => {
      const next = {
        ...state,
        preferences: { ...state.preferences, theme },
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
  applyEntryTest(responses) {
    const priors = computeEntryTestPriors(responses);
    set((state) => {
      const next = { ...state, skills: priors, entryTestCompleted: true };
      persist(next);
      return next;
    });
  },
}));
