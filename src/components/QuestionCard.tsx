import { useEffect, useState } from "react";
import type { Question } from "@/questions/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VizSlot } from "@/viz/VizSlot";
import { cn } from "@/lib/cn";
import { SolutionReveal } from "./SolutionReveal";
import { InkUnderline } from "./InkUnderline";
import { burstConfetti } from "@/lib/confetti";
import { playCorrectChime } from "@/lib/sound";
import { useStore } from "@/store";

export type QuestionCardProps = {
  question: Question;
  onAnswered: (correct: boolean) => void;
  onNext?: () => void;
};

function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function QuestionCard({ question, onAnswered, onNext }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [order] = useState<number[]>(() =>
    (question.type === "mc" || question.type === "multi-mc")
      ? shuffledIndices(question.options.length)
      : [],
  );
  const soundEnabled = useStore((s) => s.preferences.soundEnabled);

  function handleSubmit() {
    if (submitted) return;
    let correct = false;
    if (question.type === "mc") {
      if (selected === null) return;
      correct = selected === question.correct;
    } else if (question.type === "numeric") {
      if (selected === null) return;
      correct = Math.abs(selected - question.correct.value) <= question.correct.tolerance;
    } else if (question.type === "multi-mc") {
      if (selectedMulti.length === 0) return;
      const want = [...question.correct].sort((a, b) => a - b);
      const got = [...selectedMulti].sort((a, b) => a - b);
      correct = want.length === got.length && want.every((v, i) => v === got[i]);
    }
    setSubmitted(true);
    onAnswered(correct);
    if (correct) {
      burstConfetti(60, 1200);
      if (soundEnabled) playCorrectChime();
    }
  }

  const wasCorrect = (() => {
    if (!submitted) return false;
    if (question.type === "mc") return selected === question.correct;
    if (question.type === "numeric" && selected !== null) {
      return Math.abs(selected - question.correct.value) <= question.correct.tolerance;
    }
    if (question.type === "multi-mc") {
      const want = [...question.correct].sort((a, b) => a - b);
      const got = [...selectedMulti].sort((a, b) => a - b);
      return want.length === got.length && want.every((v, i) => v === got[i]);
    }
    return false;
  })();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      // Skip when typing in inputs/textareas, but Enter still submits numeric type
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        if (e.key === "Enter" && question.type === "numeric" && !submitted) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (submitted) {
        if ((e.key === "Enter" || e.key === "ArrowRight") && onNext) {
          e.preventDefault();
          onNext();
        }
        return;
      }

      if (question.type === "mc") {
        const code = e.key.toLowerCase();
        if (code >= "a" && code <= "e") {
          const displayIdx = code.charCodeAt(0) - "a".charCodeAt(0);
          if (displayIdx < order.length) {
            e.preventDefault();
            setSelected(order[displayIdx]);
          }
        } else if (e.key === "Enter" && selected !== null) {
          e.preventDefault();
          handleSubmit();
        }
      } else if (question.type === "numeric") {
        // Enter on numeric handled above (it's typed in an input)
      } else if (question.type === "multi-mc") {
        const code = e.key.toLowerCase();
        if (code >= "a" && code <= "e") {
          const displayIdx = code.charCodeAt(0) - "a".charCodeAt(0);
          if (displayIdx < order.length) {
            e.preventDefault();
            const origIdx = order[displayIdx];
            setSelectedMulti((prev) =>
              prev.includes(origIdx) ? prev.filter((i) => i !== origIdx) : [...prev, origIdx],
            );
          }
        } else if (e.key === "Enter" && selectedMulti.length > 0) {
          e.preventDefault();
          handleSubmit();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, order, selected, selectedMulti, submitted, onNext]);

  const hasViz = !!question.viz;

  return (
    <Card className={cn("p-6 grid gap-6", hasViz && "md:grid-cols-2")}>
      <div>
        <p className="font-display text-xl mb-4">{question.stem}</p>

        {question.type === "mc" && (
          <ul className="space-y-2">
            {order.map((originalIdx, displayIdx) => {
              const opt = question.options[originalIdx];
              return (
                <li key={originalIdx}>
                  <label
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                      "border-border",
                      selected === originalIdx && !submitted && "border-accent bg-accent/10",
                      submitted &&
                        originalIdx === question.correct &&
                        "border-correct bg-correct/15",
                      submitted &&
                        selected === originalIdx &&
                        originalIdx !== question.correct &&
                        "border-wrong bg-wrong/15",
                    )}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={originalIdx}
                      checked={selected === originalIdx}
                      onChange={() => setSelected(originalIdx)}
                      disabled={submitted}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "size-4 rounded-full border-2 border-border flex-shrink-0 transition-colors",
                        selected === originalIdx && !submitted && "border-accent bg-accent",
                        submitted &&
                          originalIdx === question.correct &&
                          "border-correct bg-correct",
                        submitted &&
                          selected === originalIdx &&
                          originalIdx !== question.correct &&
                          "border-wrong bg-wrong",
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-sm text-muted-foreground">
                      {String.fromCharCode(97 + displayIdx)})
                    </span>
                    <span>{opt}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {question.type === "numeric" && (
          <div className="mb-2">
            <input
              type="number"
              step="any"
              value={selected ?? ""}
              onChange={(e) =>
                setSelected(e.target.value === "" ? null : parseFloat(e.target.value))
              }
              disabled={submitted}
              placeholder="Antwort eingeben"
              aria-label="Numerische Antwort"
              className="border-2 border-border rounded-md px-3 py-2 w-48 bg-bg"
              inputMode="decimal"
            />
          </div>
        )}

        {question.type === "multi-mc" && (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Wähle alle zutreffenden Antworten.
            </p>
            <ul className="space-y-2">
              {order.map((originalIdx, displayIdx) => {
                const opt = question.options[originalIdx];
                const isSelected = selectedMulti.includes(originalIdx);
                const correctSet = question.correct as number[];
                const isCorrect = correctSet.includes(originalIdx);
                return (
                  <li key={originalIdx}>
                    <label
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                        "border-border",
                        isSelected && !submitted && "border-accent bg-accent/10",
                        submitted && isCorrect && "border-correct bg-correct/15",
                        submitted && isSelected && !isCorrect && "border-wrong bg-wrong/15",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (submitted) return;
                          if (e.target.checked) {
                            setSelectedMulti((prev) => [...prev, originalIdx]);
                          } else {
                            setSelectedMulti((prev) => prev.filter((i) => i !== originalIdx));
                          }
                        }}
                        disabled={submitted}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "size-4 rounded-[2px] border-2 border-border flex-shrink-0 flex items-center justify-center transition-colors",
                          isSelected && !submitted && "border-accent bg-accent",
                          submitted && isCorrect && "border-correct bg-correct",
                          submitted && isSelected && !isCorrect && "border-wrong bg-wrong",
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="var(--brand-on-accent)" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {String.fromCharCode(97 + displayIdx)})
                      </span>
                      <span>{opt}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={
              question.type === "multi-mc"
                ? selectedMulti.length === 0
                : selected === null
            }
            className="mt-4"
          >
            Prüfen <kbd className="ml-2 text-xs opacity-60 font-mono">↵</kbd>
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <p
              className={cn(
                "font-medium",
                wasCorrect ? "text-correct" : "text-wrong",
              )}
            >
              {wasCorrect ? <InkUnderline>Richtig.</InkUnderline> : "Falsch."}
            </p>
            <p className="text-sm">{question.explanation}</p>
            {!wasCorrect && question.type === "numeric" && (
              <p className="text-sm text-muted-foreground">
                Richtige Antwort: {question.correct.value} (Toleranz ±{question.correct.tolerance})
              </p>
            )}
            {question.solutionSteps && question.solutionSteps.length > 0 && (
              <SolutionReveal steps={question.solutionSteps} />
            )}
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
