import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { allQuestions } from "@/questions";
import { useStore } from "@/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Question } from "@/questions/types";
import type { EntryTestResponse } from "@/engine/entryTest";
import { computeEntryTestPriors } from "@/engine/entryTest";
import { SKILLS } from "@/engine/skills";

const TARGET_SKILLS = ["bayes", "binomial-poisson", "clt", "bedingt", "normal-exp"] as const;
const ENTRY_TEST_COUNT = 5;

function pickEntryTest(bank: Question[]): Question[] {
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
    if (chosen.length >= ENTRY_TEST_COUNT) break;
    if (!used.has(q.id)) {
      chosen.push(q);
      used.add(q.id);
    }
  }
  while (chosen.length < ENTRY_TEST_COUNT && bank.length > 0) {
    chosen.push(bank[chosen.length % bank.length]);
  }
  return chosen.slice(0, ENTRY_TEST_COUNT);
}

export function EntryTest() {
  const navigate = useNavigate();
  const applyEntryTest = useStore((s) => s.applyEntryTest);
  const bank = useMemo(() => allQuestions(), []);
  const questions = useMemo(() => pickEntryTest(bank), [bank]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<number[]>([]);
  const [responses, setResponses] = useState<EntryTestResponse[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [bootstrappedPriors, setBootstrappedPriors] = useState<Record<string, number> | null>(null);

  const current = questions[index];
  if (!current) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Keine Eingangstest-Fragen verfügbar.</p>
      </section>
    );
  }
  function handleNext() {
    if (!current) return;
    let correct = false;
    if (current.type === "mc") {
      if (selected === null) return;
      correct = selected === current.correct;
    } else if (current.type === "numeric") {
      if (selected === null) return;
      correct = Math.abs(selected - current.correct.value) <= current.correct.tolerance;
    } else if (current.type === "multi-mc") {
      if (selectedMulti.length === 0) return;
      const want = [...current.correct].sort((a, b) => a - b);
      const got = [...selectedMulti].sort((a, b) => a - b);
      correct = want.length === got.length && want.every((v, i) => v === got[i]);
    }
    const newResponses: EntryTestResponse[] = [
      ...responses,
      ...current.skills.map((skill) => ({ skill, correct })),
    ];
    if (index + 1 >= questions.length) {
      setResponses(newResponses);
      setBootstrappedPriors(computeEntryTestPriors(newResponses));
      setShowSummary(true);
    } else {
      setResponses(newResponses);
      setIndex(index + 1);
      setSelected(null);
      setSelectedMulti([]);
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
      applyEntryTest(responses);
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
        <h2 className="font-display text-3xl mb-1">Eingangstest</h2>
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

        {current.type === "mc" && (
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
                    name={`entry-${current.id}`}
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
        )}

        {current.type === "numeric" && (
          <div className="mb-2">
            <input
              type="number"
              step="any"
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value === "" ? null : parseFloat(e.target.value))}
              placeholder="Antwort eingeben"
              aria-label="Numerische Antwort"
              className="border-2 border-border rounded-md px-3 py-2 w-48 bg-bg"
              inputMode="decimal"
            />
          </div>
        )}

        {current.type === "multi-mc" && (
          <>
            <p className="text-xs text-muted-foreground mb-2">Wähle alle zutreffenden Antworten.</p>
            <ul className="space-y-2">
              {current.options.map((opt, i) => {
                const isSel = selectedMulti.includes(i);
                return (
                  <li key={i}>
                    <label
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                        "border-border",
                        isSel && "border-accent bg-accent/10",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMulti((prev) => [...prev, i]);
                          else setSelectedMulti((prev) => prev.filter((v) => v !== i));
                        }}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "size-4 rounded-[2px] border-2 border-border flex-shrink-0",
                          isSel && "border-accent bg-accent",
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-sm text-muted-foreground">
                        {String.fromCharCode(97 + i)})
                      </span>
                      <span>{opt}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Button
          onClick={handleNext}
          disabled={
            current.type === "multi-mc"
              ? selectedMulti.length === 0
              : selected === null
          }
          className="mt-4"
        >
          {index + 1 >= questions.length ? "Eingangstest abschließen" : "Weiter"}
        </Button>
      </Card>
    </section>
  );
}
