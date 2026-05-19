import { useEffect, useRef } from "react";
import { motion, useAnimation } from "motion/react";
import { useStore } from "@/store";
import { getSkill, type SkillId } from "@/engine/skills";

function SkillRow({ skillId }: { skillId: SkillId }) {
  const skills = useStore((s) => s.skills);
  const skill = getSkill(skillId);
  const pL = skills[skillId] ?? 0;
  const prevPL = useRef(pL);
  const glow = useAnimation();

  useEffect(() => {
    if (prevPL.current !== pL) {
      glow.start({
        boxShadow: [
          "0 0 0px 0px var(--brand-accent)",
          "0 0 12px 2px var(--brand-accent)",
          "0 0 0px 0px var(--brand-accent)",
        ],
        transition: { duration: 0.8 },
      });
      prevPL.current = pL;
    }
  }, [pL, glow]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm">{skill.label}</span>
        <span className="text-xs font-mono text-muted-foreground">
          {(pL * 100).toFixed(0)}%
        </span>
      </div>
      <motion.div
        className="h-2 rounded-full bg-muted overflow-hidden"
        animate={glow}
      >
        <motion.div
          className="h-full bg-accent"
          initial={false}
          animate={{ width: `${pL * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </motion.div>
    </div>
  );
}

export function SkillSidebar({ skillIds }: { skillIds: SkillId[] }) {
  if (skillIds.length === 0) return null;
  return (
    <aside className="space-y-3">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
        Diese Frage betrifft
      </h3>
      {skillIds.map((sid) => (
        <SkillRow key={sid} skillId={sid} />
      ))}
    </aside>
  );
}
