import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { allQuestions } from "@/questions";
import { useStore } from "@/store";
import { getSkill, SKILLS, type SkillId } from "@/engine/skills";
import { QuestionCard } from "@/components/QuestionCard";
import { VizSlot } from "@/viz/VizSlot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DEFAULT_VIZ: Partial<Record<SkillId, { component: string; props: Record<string, unknown> }>> = {
  bayes: { component: "BayesUpdater", props: { prior: 0.1, sensitivity: 0.9, fpr: 0.05 } },
  bedingt: { component: "BayesUpdater", props: { prior: 0.5, sensitivity: 0.7, fpr: 0.3 } },
  "binomial-poisson": { component: "BinomialPMF", props: { n: 10, p: 0.5 } },
  clt: { component: "CLTDemo", props: { distribution: "uniform", n: 30, trials: 1500 } },
  "normal-exp": { component: "HypothesisTest", props: { mu0: 0, mu1: 2, sigma: 1, alpha: 0.05 } },
  "zv-diskret": { component: "BinomialPMF", props: { n: 8, p: 0.3 } },
  "zv-stetig": { component: "HypothesisTest", props: { mu0: 0, mu1: 1, sigma: 1, alpha: 0.05 } },
  "erwartungswert-varianz": { component: "BinomialPMF", props: { n: 12, p: 0.4 } },
  markov: { component: "MarkovChain", props: {} },
  konfidenz: { component: "ConfidenceInterval", props: { mu: 0, sigma: 1, n: 30 } },
  tests: { component: "HypothesisTest", props: { mu0: 0, mu1: 1.5, sigma: 1, alpha: 0.05 } },
  "regression-schl": { component: "Regression", props: {} },
  "regression-deskr": { component: "Regression", props: {} },
  korrelation: { component: "Regression", props: {} },
  "lorenz-gini": { component: "LorenzGini", props: {} },
  "quantile-boxplot": { component: "Boxplot", props: {} },
  lagemasse: { component: "Boxplot", props: {} },
  streuung: { component: "Boxplot", props: {} },
  kombinatorik: { component: "GaltonBoard", props: { n: 10, p: 0.5, balls: 1500 } },
  "schaetzer-ml": { component: "BinomialPMF", props: { n: 20, p: 0.5 } },
};

export function DeepDive() {
  const params = useParams<{ skill: string }>();
  const skillId = params.skill as SkillId | undefined;
  const recordAnswer = useStore((s) => s.recordAnswer);
  const allQ = useMemo(() => allQuestions(), []);
  const [freePlay, setFreePlay] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const skills = useStore((s) => s.skills);
  const filtered = useMemo(
    () => (skillId ? allQ.filter((q) => q.skills[0] === skillId) : []),
    [allQ, skillId],
  );

  // Validate skill
  const skillExists = skillId && SKILLS.some((s) => s.id === skillId);
  if (!skillId || !skillExists) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground mb-4">Unbekannter Skill: {String(skillId)}</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </section>
    );
  }

  const skill = getSkill(skillId);
  const skillPL = skills[skillId] ?? 0;

  const current = filtered[currentIdx];

  function handleAnswered(correct: boolean) {
    if (!current) return;
    if (!freePlay) {
      recordAnswer(current.id, current.skills, correct);
    }
  }

  function handleNext() {
    setCurrentIdx((i) => (filtered.length > 0 ? (i + 1) % filtered.length : 0));
  }

  const vizSpec = DEFAULT_VIZ[skillId] ?? { component: "GaltonBoard", props: { n: 10, p: 0.5, balls: 1000 } };

  return (
    <section className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <header>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-3xl">{skill.label}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">← Dashboard</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Aktueller Skill-Stand: <strong>{(skillPL * 100).toFixed(0)}%</strong> · {filtered.length} Aufgaben verfügbar
        </p>
      </header>

      <Card className="p-6">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-4">Spielwiese</h3>
        <div className="flex items-center justify-center">
          <VizSlot spec={vizSpec} width={520} height={300} controlled={false} />
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Aufgaben</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={freePlay}
              onChange={(e) => setFreePlay(e.target.checked)}
              className="size-4"
            />
            Free Play (kein BKT-Update)
          </label>
        </div>

        {current ? (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Aufgabe {currentIdx + 1} von {filtered.length}
            </p>
            <QuestionCard
              key={`${current.id}-${currentIdx}`}
              question={current}
              onAnswered={handleAnswered}
              onNext={handleNext}
            />
          </>
        ) : (
          <p className="text-muted-foreground">Noch keine Aufgaben für diesen Skill in der Bank.</p>
        )}
      </div>
    </section>
  );
}
