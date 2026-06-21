import { useEffect, useState } from "react";
import type { MultiPartQuestion, QuestionPart } from "@/questions/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VizSlot } from "@/viz/VizSlot";
import { cn } from "@/lib/cn";
import { InkUnderline } from "./InkUnderline";
import { burstConfetti } from "@/lib/confetti";
import { playCorrectChime } from "@/lib/sound";
import { useStore } from "@/store";

export type MultiPartCardProps = {
  question: MultiPartQuestion;
  onAnswered: (correct: boolean) => void;
  onNext?: () => void;
};

type PartAnswer = number | null;

function isPartCorrect(part: QuestionPart, ans: PartAnswer): boolean {
  if (ans === null) return false;
  if (part.type === "mc") return ans === part.correct;
  return Math.abs(ans - part.correct.value) <= part.correct.tolerance;
}

export function MultiPartCard({ question, onAnswered, onNext }: MultiPartCardProps) {
  const [answers, setAnswers] = useState<PartAnswer[]>(() =>
    question.parts.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const soundEnabled = useStore((s) => s.preferences.soundEnabled);

  const allAnswered = answers.every((a) => a !== null);

  function handleSubmit() {
    if (submitted || !allAnswered) return;
    const allCorrect = question.parts.every((p, i) => isPartCorrect(p, answers[i]));
    setSubmitted(true);
    onAnswered(allCorrect);
    if (allCorrect) {
      burstConfetti(80, 1400);
      if (soundEnabled) playCorrectChime();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submitted) {
        if ((e.key === "Enter" || e.key === "ArrowRight") && onNext) {
          e.preventDefault();
          onNext();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitted, onNext]);

  const hasViz = !!question.viz;
  const correctCount = question.parts.filter((p, i) => isPartCorrect(p, answers[i])).length;
  const overallCorrect = submitted && correctCount === question.parts.length;

  return (
    <Card className={cn("p-6 grid gap-6", hasViz && "md:grid-cols-2")}>
      <div>
        <p className="font-display text-xl mb-2">{question.stem}</p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
          Mehrteilige Aufgabe — alle Teile beantworten
        </p>

        <ol className="space-y-5">
          {question.parts.map((part, i) => {
            const ans = answers[i];
            const correct = isPartCorrect(part, ans);
            return (
              <li key={i} className="border-l-2 border-border pl-4">
                <p className="text-sm font-medium mb-2">
                  <span className="font-mono text-accent mr-2">{part.label}</span>
                  {part.stem}
                </p>

                {part.type === "mc" ? (
                  <ul className="space-y-1">
                    {part.options.map((opt, optIdx) => {
                      const isSelected = ans === optIdx;
                      const isCorrectOpt = optIdx === part.correct;
                      return (
                        <li key={optIdx}>
                          <label
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded border text-sm cursor-pointer transition-colors",
                              "border-border",
                              isSelected && !submitted && "border-accent bg-accent/10",
                              submitted && isCorrectOpt && "border-correct bg-correct/15",
                              submitted &&
                                isSelected &&
                                !isCorrectOpt &&
                                "border-wrong bg-wrong/15",
                            )}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}-${i}`}
                              value={optIdx}
                              checked={isSelected}
                              onChange={() => {
                                if (submitted) return;
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  next[i] = optIdx;
                                  return next;
                                });
                              }}
                              disabled={submitted}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                "size-3.5 rounded-full border-2 border-border flex-shrink-0 transition-colors",
                                isSelected && !submitted && "border-accent bg-accent",
                                submitted && isCorrectOpt && "border-correct bg-correct",
                                submitted &&
                                  isSelected &&
                                  !isCorrectOpt &&
                                  "border-wrong bg-wrong",
                              )}
                              aria-hidden="true"
                            />
                            <span>{opt}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={ans ?? ""}
                    onChange={(e) => {
                      if (submitted) return;
                      const v = e.target.value === "" ? null : parseFloat(e.target.value);
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      });
                    }}
                    disabled={submitted}
                    placeholder="Antwort"
                    aria-label={`Numerische Antwort Teil ${part.label}`}
                    className="border-2 border-border rounded-md px-3 py-1.5 w-40 bg-bg text-sm"
                    inputMode="decimal"
                  />
                )}

                {submitted && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className={correct ? "text-correct" : "text-wrong"}>
                      {correct ? "✓ richtig" : "✗ falsch"}
                      {!correct && part.type === "numeric" && (
                        <span className="text-muted-foreground">
                          {" "}— erwartet: {part.correct.value} (±{part.correct.tolerance})
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{part.explanation}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!allAnswered} className="mt-5">
            Alles prüfen <kbd className="ml-2 text-xs opacity-60 font-mono">↵</kbd>
          </Button>
        ) : (
          <div className="mt-5 space-y-3">
            <p
              className={cn(
                "font-medium",
                overallCorrect ? "text-correct" : "text-wrong",
              )}
            >
              {overallCorrect ? (
                <InkUnderline>Komplett richtig.</InkUnderline>
              ) : (
                `${correctCount} von ${question.parts.length} Teilen richtig.`
              )}
            </p>
            <p className="text-sm">{question.explanation}</p>
            {onNext && (
              <Button onClick={onNext} variant="outline">
                Nächste Frage <kbd className="ml-2 text-xs opacity-60 font-mono">→</kbd>
              </Button>
            )}
          </div>
        )}
      </div>

      {hasViz && (
        <div className="flex items-center justify-center">
          <VizSlot spec={question.viz} />
        </div>
      )}
    </Card>
  );
}
