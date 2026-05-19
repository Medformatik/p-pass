import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { allQuestions } from "@/questions";
import { useStore } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Question } from "@/questions/types";
import type { DiagnosticResponse } from "@/engine/diagnose";
import { computeDiagnosticPriors } from "@/engine/diagnose";
import { SKILLS } from "@/engine/skills";

const TARGET_SKILLS = ["bayes", "binomial-poisson", "clt", "bedingt", "normal-exp"] as const;
const DIAGNOSTIC_COUNT = 5;

function pickDiagnostic(bank: Question[]): Question[] {
  const chosen: Question[] = [];
  const used = new Set<string>();
  for (const target of TARGET_SKILLS) {
    const q = bank.find((q) => q.skills.includes(target) && !used.has(q.id));
    if (q) {
      chosen.push(q);
      used.add(q.id);
    }
  }
  for (const q of bank) {
    if (chosen.length >= DIAGNOSTIC_COUNT) break;
    if (!used.has(q.id)) {
      chosen.push(q);
      used.add(q.id);
    }
  }
  while (chosen.length < DIAGNOSTIC_COUNT && bank.length > 0) {
    chosen.push(bank[chosen.length % bank.length]);
  }
  return chosen.slice(0, DIAGNOSTIC_COUNT);
}

export function Diagnose() {
  const navigate = useNavigate();
  const applyDiagnostic = useStore((s) => s.applyDiagnostic);
  const bank = useMemo(() => allQuestions(), []);
  const questions = useMemo(() => pickDiagnostic(bank), [bank]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [responses, setResponses] = useState<DiagnosticResponse[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [bootstrappedPriors, setBootstrappedPriors] = useState<Record<string, number> | null>(null);

  const current = questions[index];
  if (!current) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Keine Diagnose-Fragen verfügbar.</p>
      </section>
    );
  }
  if (current.type !== "mc") {
    return (
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Diagnose unterstützt aktuell nur MC-Fragen.</p>
      </section>
    );
  }

  function handleNext() {
    if (selected === null || !current || current.type !== "mc") return;
    const correct = selected === current.correct;
    const newResponses: DiagnosticResponse[] = [
      ...responses,
      ...current.skills.map((skill) => ({ skill, correct })),
    ];
    if (index + 1 >= questions.length) {
      setResponses(newResponses);
      setBootstrappedPriors(computeDiagnosticPriors(newResponses));
      setShowSummary(true);
    } else {
      setResponses(newResponses);
      setIndex(index + 1);
      setSelected(null);
    }
  }

  const progress = ((index + 1) / questions.length) * 100;

  if (showSummary && bootstrappedPriors) {
    const sorted = SKILLS.map((s) => ({
      skill: s,
      pL: bootstrappedPriors[s.id] ?? s.bktParams.pL0,
    })).sort((a, b) => b.pL - a.pL);
    const strongest = sorted.slice(0, 5);
    const weakest = sorted.slice(-5).reverse();

    function finish() {
      applyDiagnostic(responses);
      navigate("/train");
    }

    return (
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="font-display text-3xl mb-2">So schätzen wir dich ein</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Basierend auf deinen 5 Antworten setzen wir folgende Startwerte für deine Skill-Wahrscheinlichkeiten.
          Im Training passen wir das per Bayes-Update kontinuierlich an.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">Stärken</h3>
            <ul className="space-y-2">
              {strongest.map(({ skill, pL }) => (
                <li key={skill.id} className="flex items-center justify-between text-sm">
                  <span>{skill.label}</span>
                  <span className="font-mono text-xs">{(pL * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Schwächen (hier setzen wir an)
            </h3>
            <ul className="space-y-2">
              {weakest.map(({ skill, pL }) => (
                <li key={skill.id} className="flex items-center justify-between text-sm">
                  <span>{skill.label}</span>
                  <span className="font-mono text-xs">{(pL * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={finish}>Training starten</Button>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-6">
        <h2 className="font-display text-3xl mb-1">Diagnose</h2>
        <p className="text-sm text-muted-foreground">
          Frage {index + 1} von {questions.length} · Wir zeigen dir 5 Aufgaben, damit wir deinen
          Startpunkt schätzen können. Kein Feedback zwischendurch.
        </p>
        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card key={current.id} className="p-6">
        <p className="font-display text-xl mb-4">{current.stem}</p>
        <ul className="space-y-2">
          {current.options.map((opt, i) => (
            <li key={i}>
              <label
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                  "border-border",
                  selected === i && "border-accent bg-accent/10",
                )}
              >
                <input
                  type="radio"
                  name={`diag-${current.id}`}
                  value={i}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "size-4 rounded-full border-2 border-border flex-shrink-0 transition-colors",
                    selected === i && "border-accent bg-accent",
                  )}
                  aria-hidden="true"
                />
                <span className="font-mono text-sm text-muted-foreground">
                  {String.fromCharCode(97 + i)})
                </span>
                <span>{opt}</span>
              </label>
            </li>
          ))}
        </ul>
        <Button onClick={handleNext} disabled={selected === null} className="mt-4">
          {index + 1 >= questions.length ? "Diagnose abschließen" : "Weiter"}
        </Button>
      </Card>
    </section>
  );
}
