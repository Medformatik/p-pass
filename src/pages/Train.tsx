import { useMemo, useState } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { allQuestions } from "@/questions";
import { useStore } from "@/store";
import { pickNextQuestion } from "@/engine/selector";

export function Train() {
  const skills = useStore((s) => s.skills);
  const history = useStore((s) => s.history);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const bank = useMemo(() => allQuestions(), []);
  const recentIds = useMemo(() => history.slice(-20).map((h) => h.qid), [history]);

  const [currentId, setCurrentId] = useState<string | null>(() => {
    const q = pickNextQuestion(bank, skills, recentIds);
    return q?.id ?? null;
  });

  const current = useMemo(
    () => bank.find((q) => q.id === currentId),
    [bank, currentId],
  );

  function handleAnswered(correct: boolean) {
    if (!current) return;
    recordAnswer(current.id, current.skills, correct);
  }

  function handleNext() {
    const fresh = useStore.getState();
    const recent = fresh.history.slice(-20).map((h) => h.qid);
    const next = pickNextQuestion(bank, fresh.skills, recent);
    setCurrentId(next?.id ?? null);
  }

  if (!current) {
    return (
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-muted-foreground">Keine weitere Aufgabe gefunden.</p>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <QuestionCard key={current.id} question={current} onAnswered={handleAnswered} onNext={handleNext} />
    </section>
  );
}
