import { motion } from "motion/react";
import { useStore } from "@/store";
import { getSkill, type SkillId } from "@/engine/skills";

export function SkillSidebar({ skillIds }: { skillIds: SkillId[] }) {
  const skills = useStore((s) => s.skills);
  if (skillIds.length === 0) return null;
  return (
    <aside className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
        Diese Frage betrifft
      </h3>
      {skillIds.map((sid) => {
        const skill = getSkill(sid);
        const pL = skills[sid] ?? 0;
        return (
          <div key={sid}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm">{skill.label}</span>
              <span className="text-xs font-mono text-muted-foreground">
                {(pL * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-accent"
                initial={false}
                animate={{ width: `${pL * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
}
