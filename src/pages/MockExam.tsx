import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { allQuestions } from "@/questions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Question } from "@/questions/types";

// Mock-Klausur lässt Multi-Part-Aufgaben aus (zu lang fürs 10-Fragen-Quick-Mock —
// sie sind für Deep-Dive / Train gedacht).
type ExamQuestion = Exclude<Question, { type: "multi-part" }>;

type UserAnswer =
  | { type: "mc"; selected: number | null }
  | { type: "numeric"; value: number | null }
  | { type: "multi-mc"; selected: number[] };

const EXAM_SIZE = 10;

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickExamSet(bank: Question[]): ExamQuestion[] {
  const eligible = bank.filter((q): q is ExamQuestion => q.type !== "multi-part");
  return shuffled(eligible).slice(0, EXAM_SIZE);
}

function isCorrect(q: ExamQuestion, ans: UserAnswer): boolean {
  if (q.type === "mc" && ans.type === "mc") return ans.selected === q.correct;
  if (q.type === "numeric" && ans.type === "numeric") {
    if (ans.value === null) return false;
    return Math.abs(ans.value - q.correct.value) <= q.correct.tolerance;
  }
  if (q.type === "multi-mc" && ans.type === "multi-mc") {
    const want = [...q.correct].sort((a, b) => a - b);
    const got = [...ans.selected].sort((a, b) => a - b);
    return want.length === got.length && want.every((v, i) => v === got[i]);
  }
  return false;
}

function formatAnswer(q: ExamQuestion, ans: UserAnswer): string {
  if (q.type === "mc" && ans.type === "mc") {
    return ans.selected !== null ? q.options[ans.selected] : "—";
  }
  if (q.type === "numeric" && ans.type === "numeric") {
    return ans.value !== null ? String(ans.value) : "—";
  }
  if (q.type === "multi-mc" && ans.type === "multi-mc") {
    return ans.selected.length > 0
      ? ans.selected.map((i) => q.options[i]).join(", ")
      : "—";
  }
  return "—";
}

function formatCorrect(q: ExamQuestion): string {
  if (q.type === "mc") return q.options[q.correct];
  if (q.type === "numeric") return `${q.correct.value} (± ${q.correct.tolerance})`;
  return q.correct.map((i) => q.options[i]).join(", ");
}

function emptyAnswer(q: ExamQuestion): UserAnswer {
  if (q.type === "mc") return { type: "mc", selected: null };
  if (q.type === "numeric") return { type: "numeric", value: null };
  return { type: "multi-mc", selected: [] };
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MockExam() {
  const bank = useMemo(() => allQuestions(), []);
  const [questions] = useState<ExamQuestion[]>(() => pickExamSet(bank));
  const [answers, setAnswers] = useState<UserAnswer[]>(() => questions.map(emptyAnswer));
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const startRef = useRef(performance.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 1000);
    return () => clearInterval(id);
  }, [submitted]);

  const current = questions[index];

  function updateCurrent(updater: (prev: UserAnswer) => UserAnswer) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? updater(a) : a)));
  }

  function finishExam() {
    setSubmitted(true);
    setElapsed(performance.now() - startRef.current);
  }

  // Results screen
  if (submitted) {
    const correctCount = questions.reduce((s, q, i) => s + (isCorrect(q, answers[i]) ? 1 : 0), 0);
    const pct = (correctCount / questions.length) * 100;
    return (
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="font-display text-3xl mb-2">Mock-Klausur — Ergebnis</h2>
        <p className="text-muted-foreground mb-6">
          {correctCount} von {questions.length} richtig · {pct.toFixed(0)}% · Zeit {formatTime(elapsed)}
        </p>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const ok = isCorrect(q, answers[i]);
            return (
              <Card key={q.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "shrink-0 size-6 rounded-full grid place-items-center text-xs font-bold",
                      ok ? "bg-correct text-[--brand-on-accent]" : "bg-wrong text-[--brand-on-accent]",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1 line-clamp-2">{q.stem}</p>
                    <p className="text-xs text-muted-foreground">
                      Deine Antwort: <span className="font-mono">{formatAnswer(q, answers[i])}</span>
                    </p>
                    {!ok && (
                      <p className="text-xs text-muted-foreground">
                        Richtig: <span className="font-mono">{formatCorrect(q)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Button asChild>
            <Link to="/train">Zurück zum Training</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/mock" reloadDocument>
              Neue Mock-Klausur
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-12 text-center text-muted-foreground">
        Keine Aufgaben verfügbar.
      </section>
    );
  }

  // Question screen — minimal inline rendering (no QuestionCard which would record to BKT)
  const ans = answers[index];

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl">Mock-Klausur</h2>
          <p className="text-xs text-muted-foreground">
            Frage {index + 1} von {questions.length} · Kein Feedback während der Klausur
          </p>
        </div>
        <span className="font-mono text-sm tabular-nums">⏱ {formatTime(elapsed)}</span>
      </div>

      <div className="mb-3 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="p-6">
        <p className="font-display text-xl mb-4">{current.stem}</p>

        {current.type === "mc" && ans.type === "mc" && (
          <ul className="space-y-2">
            {current.options.map((opt, i) => (
              <li key={i}>
                <label
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md border-2 cursor-pointer transition-colors",
                    "border-border",
                    ans.selected === i && "border-accent bg-accent/10",
                  )}
                >
                  <input
                    type="radio"
                    checked={ans.selected === i}
                    onChange={() => updateCurrent(() => ({ type: "mc", selected: i }))}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "size-4 rounded-full border-2 border-border flex-shrink-0",
                      ans.selected === i && "border-accent bg-accent",
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

        {current.type === "numeric" && ans.type === "numeric" && (
          <input
            type="number"
            step="any"
            value={ans.value ?? ""}
            onChange={(e) =>
              updateCurrent(() => ({
                type: "numeric",
                value: e.target.value === "" ? null : parseFloat(e.target.value),
              }))
            }
            placeholder="Antwort eingeben"
            className="border-2 border-border rounded-md px-3 py-2 w-48 bg-bg"
            inputMode="decimal"
          />
        )}

        {current.type === "multi-mc" && ans.type === "multi-mc" && (
          <>
            <p className="text-xs text-muted-foreground mb-2">Wähle alle zutreffenden Antworten.</p>
            <ul className="space-y-2">
              {current.options.map((opt, i) => {
                const isSel = ans.selected.includes(i);
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
                          updateCurrent((prev) => {
                            if (prev.type !== "multi-mc") return prev;
                            const next = e.target.checked
                              ? [...prev.selected, i]
                              : prev.selected.filter((v) => v !== i);
                            return { type: "multi-mc", selected: next };
                          });
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
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Zurück
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>Weiter</Button>
        ) : (
          <Button onClick={finishExam}>Klausur abschließen</Button>
        )}
      </div>
    </section>
  );
}
