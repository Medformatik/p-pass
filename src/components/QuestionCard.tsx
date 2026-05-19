import { useState } from "react";
import type { Question } from "@/questions/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GaltonBoard } from "@/viz/GaltonBoard";
import { cn } from "@/lib/cn";

export type QuestionCardProps = {
  question: Question;
  onAnswered: (correct: boolean) => void;
  onNext?: () => void;
};

export function QuestionCard({ question, onAnswered, onNext }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (question.type !== "mc") {
    return (
      <Card className="p-6">
        Frage-Typ {question.type} wird hier noch nicht unterstützt.
      </Card>
    );
  }

  function handleSubmit() {
    if (selected === null || submitted) return;
    const correct = selected === question.correct;
    setSubmitted(true);
    onAnswered(correct);
  }

  const wasCorrect = submitted && selected === question.correct;

  return (
    <Card className="p-6 grid gap-6 md:grid-cols-2">
      <div>
        <p className="font-display text-xl mb-4">{question.stem}</p>
        <ul className="space-y-2">
          {question.options.map((opt, i) => (
            <li key={i}>
              <label
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                  "border-border",
                  selected === i && !submitted && "border-accent bg-accent/10",
                  submitted &&
                    i === question.correct &&
                    "border-correct bg-correct/15",
                  submitted &&
                    selected === i &&
                    i !== question.correct &&
                    "border-wrong bg-wrong/15",
                )}
              >
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  value={i}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  disabled={submitted}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "size-4 rounded-full border-2 border-border flex-shrink-0 transition-colors",
                    selected === i && !submitted && "border-accent bg-accent",
                    submitted && i === question.correct && "border-correct bg-correct",
                    submitted &&
                      selected === i &&
                      i !== question.correct &&
                      "border-wrong bg-wrong",
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

        {!submitted ? (
          <Button onClick={handleSubmit} disabled={selected === null} className="mt-4">
            Prüfen
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <p
              className={cn(
                "font-medium",
                wasCorrect ? "text-correct" : "text-wrong",
              )}
            >
              {wasCorrect ? "Richtig." : "Falsch."}
            </p>
            <p className="text-sm">{question.explanation}</p>
            {onNext && (
              <Button onClick={onNext} variant="outline">
                Nächste Frage
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        {question.viz?.component === "GaltonBoard" ? (
          <GaltonBoard
            {...(question.viz.props as {
              n: number;
              p: number;
              balls?: number;
              highlight?: number;
            })}
            width={360}
            height={280}
          />
        ) : (
          <div className="text-muted-foreground text-sm">(keine Visualisierung)</div>
        )}
      </div>
    </Card>
  );
}
