import { useStore } from "@/store";
import { SKILLS, type SkillBlock, type Skill } from "@/engine/skills";

const BLOCK_LABEL: Record<SkillBlock, string> = {
  deskriptiv: "Deskriptiv",
  wahrsch: "Wahrscheinlichkeit",
  schliessend: "Schließend",
};

function heatColor(pL: number): string {
  const t = Math.max(0, Math.min(1, pL));
  return `color-mix(in oklab, var(--heat-cold), var(--heat-hot) ${(t * 100).toFixed(0)}%)`;
}

export function SkillHeatmap() {
  const skills = useStore((s) => s.skills);
  const grouped: Record<SkillBlock, Skill[]> = {
    deskriptiv: [],
    wahrsch: [],
    schliessend: [],
  };
  for (const s of SKILLS) grouped[s.block].push(s);

  return (
    <div className="space-y-6">
      {(Object.keys(grouped) as SkillBlock[]).map((block) => (
        <div key={block}>
          <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
            {BLOCK_LABEL[block]}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {grouped[block].map((s) => {
              const pL = skills[s.id] ?? 0;
              return (
                <div
                  key={s.id}
                  data-skill={s.id}
                  className="rounded-md border border-border p-3 transition-colors"
                  style={{ background: heatColor(pL), color: "var(--heat-ink)" }}
                >
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs font-mono mt-1">{(pL * 100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
