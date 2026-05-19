import { create } from "zustand";
import { SKILLS, DEFAULT_BKT_PARAMS, type SkillId } from "@/engine/skills";
import { bktUpdateMulti } from "@/engine/bkt";

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
};

export type StoreActions = {
  recordAnswer: (qid: string, skills: SkillId[], correct: boolean) => void;
  reset: () => void;
  toggleDarkMode: () => void;
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
      const next = { ...state, skills: after, history: newHistory };
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
}));
