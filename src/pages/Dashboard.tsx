import { useStore } from "@/store";
import { SKILLS, DEFAULT_BKT_PARAMS } from "@/engine/skills";
import { bktPredict } from "@/engine/bkt";

export function Dashboard() {
  const skills = useStore((s) => s.skills);
  const history = useStore((s) => s.history);
  const reset = useStore((s) => s.reset);

  const overall =
    SKILLS.reduce((sum, s) => sum + (skills[s.id] ?? 0), 0) / SKILLS.length;

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="font-display text-3xl mb-2">Dashboard</h2>
      <p className="text-muted-foreground mb-8">
        Klausur-Bereitschaft (Durchschnitt): {(overall * 100).toFixed(0)}% — basierend auf{" "}
        {history.length} Antworten.
      </p>

      <div className="space-y-2">
        {SKILLS.map((s) => {
          const pL = skills[s.id] ?? 0;
          const predicted = bktPredict(pL, DEFAULT_BKT_PARAMS);
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="w-56 text-sm">{s.label}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${pL * 100}%` }}
                />
              </div>
              <span className="w-20 text-right text-sm font-mono">
                {(pL * 100).toFixed(0)}%
              </span>
              <span className="w-24 text-right text-xs text-muted-foreground">
                next ✓ {(predicted * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-right">
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
