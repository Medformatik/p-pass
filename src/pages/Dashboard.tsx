import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/store";
import { SKILLS } from "@/engine/skills";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkillHeatmap } from "@/components/SkillHeatmap";
import { NumberTicker } from "@/components/NumberTicker";

export function Dashboard() {
  const skills = useStore((s) => s.skills);
  const history = useStore((s) => s.history);
  const reset = useStore((s) => s.reset);
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const overall =
    SKILLS.reduce((sum, s) => sum + (skills[s.id] ?? 0), 0) / SKILLS.length;

  const recommended = useMemo(() => {
    return SKILLS.reduce<{ id: string; label: string; pL: number } | null>(
      (acc, s) => {
        const pL = skills[s.id] ?? 0;
        if (!acc || pL < acc.pL) return { id: s.id, label: s.label, pL };
        return acc;
      },
      null,
    );
  }, [skills]);

  function handleExport() {
    const json = exportState();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `p-pass-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((txt) => {
      try {
        importState(txt);
      } catch (err) {
        alert(`Import fehlgeschlagen: ${err instanceof Error ? err.message : err}`);
      }
    });
    e.target.value = "";
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="font-display text-3xl mb-2">Dashboard</h2>
      <p className="text-muted-foreground mb-8">
        Klausur-Bereitschaft (Durchschnitt): <NumberTicker value={overall} format={(n) => `${(n * 100).toFixed(0)}%`} /> — basierend auf{" "}
        {history.length} Antworten.
      </p>

      {recommended && (
        <Card className="mb-8 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-1">Empfehlung</h3>
            <p className="font-display text-lg">
              Weitermachen mit <span className="text-accent">{recommended.label}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Schwächster Skill ({(recommended.pL * 100).toFixed(0)}%) — hier hilft Training am meisten.
            </p>
          </div>
          <Button asChild>
            <Link to="/train">
              Trainieren <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </Card>
      )}

      <SkillHeatmap />

      <div className="mt-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            Fortschritt exportieren
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Fortschritt importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        <button
          onClick={() => {
            if (confirm("Wirklich Fortschritt löschen?")) reset();
          }}
          className="text-sm text-wrong underline"
        >
          Fortschritt zurücksetzen
        </button>
      </div>
    </section>
  );
}
