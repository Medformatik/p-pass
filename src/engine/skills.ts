export type SkillId =
  | "lagemasse"
  | "streuung"
  | "quantile-boxplot"
  | "korrelation"
  | "regression-deskr"
  | "lorenz-gini"
  | "kombinatorik"
  | "bedingt"
  | "bayes"
  | "zv-diskret"
  | "zv-stetig"
  | "erwartungswert-varianz"
  | "binomial-poisson"
  | "normal-exp"
  | "clt"
  | "markov"
  | "schaetzer-ml"
  | "konfidenz"
  | "tests"
  | "regression-schl";

export type SkillBlock = "deskriptiv" | "wahrsch" | "schliessend";

export type BKTParams = {
  pL0: number;
  pT: number;
  pG: number;
  pS: number;
};

export const DEFAULT_BKT_PARAMS: BKTParams = {
  pL0: 0.2,
  pT: 0.15,
  pG: 0.2,
  pS: 0.1,
};

export type Skill = {
  id: SkillId;
  label: string;
  block: SkillBlock;
  bktParams: BKTParams;
};

export const SKILLS: Skill[] = [
  // deskriptiv
  { id: "lagemasse", label: "Lagemaße", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  { id: "streuung", label: "Streuungsmaße", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  { id: "quantile-boxplot", label: "Quantile & Boxplot", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  { id: "korrelation", label: "Korrelation", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  { id: "regression-deskr", label: "Regression (deskriptiv)", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  { id: "lorenz-gini", label: "Lorenz & Gini", block: "deskriptiv", bktParams: DEFAULT_BKT_PARAMS },
  // wahrsch
  { id: "kombinatorik", label: "Kombinatorik", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "bedingt", label: "Bedingte Wahrscheinlichkeit", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "bayes", label: "Satz von Bayes", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "zv-diskret", label: "Diskrete Zufallsvariablen", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "zv-stetig", label: "Stetige Zufallsvariablen", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "erwartungswert-varianz", label: "Erwartungswert & Varianz", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "binomial-poisson", label: "Binomial & Poisson", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "normal-exp", label: "Normal & Exponential", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "clt", label: "Zentraler Grenzwertsatz", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  { id: "markov", label: "Markov-Ketten", block: "wahrsch", bktParams: DEFAULT_BKT_PARAMS },
  // schliessend
  { id: "schaetzer-ml", label: "ML-Schätzung", block: "schliessend", bktParams: DEFAULT_BKT_PARAMS },
  { id: "konfidenz", label: "Konfidenzintervalle", block: "schliessend", bktParams: DEFAULT_BKT_PARAMS },
  { id: "tests", label: "Hypothesentests", block: "schliessend", bktParams: DEFAULT_BKT_PARAMS },
  { id: "regression-schl", label: "Regression (schließend)", block: "schliessend", bktParams: DEFAULT_BKT_PARAMS },
];

const skillMap = new Map(SKILLS.map((s) => [s.id, s] as const));

export function getSkill(id: SkillId): Skill {
  const s = skillMap.get(id);
  if (!s) throw new Error(`Unknown skill id: ${id}`);
  return s;
}
