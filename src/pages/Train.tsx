import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { SkillSidebar } from "@/components/SkillSidebar";
import { allQuestions } from "@/questions";
import { useStore } from "@/store";
import { pickNextQuestion } from "@/engine/selector";

export function Train() {
  const skills = useStore((s) => s.skills);
  const history = useStore((s) => s.history);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const diagnosticCompleted = useStore((s) => s.diagnosticCompleted);
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
    let next = pickNextQuestion(bank, fresh.skills, recent);
    if (next && next.id === currentId && bank.length > 1) {
      const filteredBank = bank.filter((q) => q.id !== currentId);
      next = pickNextQuestion(filteredBank, fresh.skills, recent);
    }
    setCurrentId(next?.id ?? null);
  }

  if (!diagnosticCompleted && history.length === 0) {
    return <Navigate to="/diagnose" replace />;
  }

  if (!current) {
    return (
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-muted-foreground">Keine weitere Aufgabe gefunden.</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-12 grid gap-6 lg:grid-cols-[1fr_240px]">
      <QuestionCard key={current.id} question={current} onAnswered={handleAnswered} onNext={handleNext} />
      <SkillSidebar skillIds={current.skills} />
    </section>
  );
}
