import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useStore } from "@/store";
import { SKILLS, getSkill, type SkillId } from "@/engine/skills";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Math } from "@/components/Math";

export function Inspector() {
  const history = useStore((s) => s.history);
  const skills = useStore((s) => s.skills);

  const defaultSkill = useMemo<SkillId>(() => {
    const counts: Record<string, number> = {};
    for (const h of history) for (const s of h.skills) counts[s] = (counts[s] ?? 0) + 1;
    const top = SKILLS.map((s) => ({ id: s.id, c: counts[s.id] ?? 0 })).sort(
      (a, b) => b.c - a.c,
    )[0];
    return (top?.id as SkillId) ?? "bayes";
  }, [history]);

  const [selected, setSelected] = useState<SkillId>(defaultSkill);
  const rows = useMemo(
    () => history.filter((h) => h.skills.includes(selected)).slice(-10).reverse(),
    [history, selected],
  );
  const currentPL = skills[selected] ?? 0;
  const skillLabel = getSkill(selected).label;

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h2 className="font-display text-3xl mb-2">Bayes-Inspektor</h2>
        <p className="text-sm text-muted-foreground">
          Das Tool nutzt Bayes-Inferenz, um zu schätzen, welche Skills du beherrschst.
          Hier siehst du, wie sich diese Schätzung über deine letzten Antworten verändert hat —
          live Bayes-Update, angewandt auf dich.
        </p>
      </div>

      <Card className="p-4">
        <label className="text-sm flex flex-wrap items-center gap-2">
          <span>Skill:</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as SkillId)}
            className="border-2 border-border rounded-md px-2 py-1 bg-bg"
          >
            {SKILLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Aktuelles P(L) für „{skillLabel}":{" "}
          <strong className="font-mono">{(currentPL * 100).toFixed(1)}%</strong>
        </p>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
          Update-Verlauf (neueste oben)
        </h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Antworten zu diesem Skill.{" "}
            <Link to="/train" className="underline">Trainieren →</Link>
          </p>
        ) : (
          <ol className="space-y-2">
            {rows.map((h, i) => {
              const before = h.pLBefore?.[selected] ?? 0;
              const after = h.pLAfter?.[selected] ?? 0;
              const delta = after - before;
              return (
                <motion.li
                  key={`${h.qid}-${h.timestamp}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 text-sm border border-border rounded-md p-3"
                >
                  <span
                    className={`shrink-0 size-2 rounded-full ${h.correct ? "bg-correct" : "bg-wrong"}`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-muted-foreground w-44 truncate">
                    {h.qid}
                  </span>
                  <span className="font-mono whitespace-nowrap">
                    {(before * 100).toFixed(1)}% → {(after * 100).toFixed(1)}%
                  </span>
                  <span
                    className={`font-mono ml-auto whitespace-nowrap ${
                      delta > 0 ? "text-correct" : "text-wrong"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {(delta * 100).toFixed(1)} pp
                  </span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>

      <Card className="p-4">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
          Die Formel
        </h3>
        <p className="text-sm mb-3">Pro Antwort führt das Tool zwei Schritte aus:</p>
        <p className="mb-2 text-sm">
          <strong>1. Posterior</strong>{" "}<Math tex="P(L \mid \mathrm{obs})" />
        </p>
        <div className="pl-4 mb-3 space-y-2">
          <Math display tex="P(L \mid \checkmark) = \frac{P(L)\,(1-S)}{P(L)\,(1-S) + (1-P(L))\,G}" />
          <Math display tex="P(L \mid \times) = \frac{P(L)\,S}{P(L)\,S + (1-P(L))\,(1-G)}" />
        </div>
        <p className="mb-2 text-sm"><strong>2. Lerntransition</strong></p>
        <div className="pl-4">
          <Math display tex="P(L_{\mathrm{neu}}) = P(L \mid \mathrm{obs}) + \bigl(1 - P(L \mid \mathrm{obs})\bigr)\cdot T" />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Parameter dieses Skills: pT = {getSkill(selected).bktParams.pT}, pG ={" "}
          {getSkill(selected).bktParams.pG}, pS = {getSkill(selected).bktParams.pS}
        </p>
      </Card>

      <div>
        <Button asChild>
          <Link to="/train">Weiter trainieren</Link>
        </Button>
      </div>
    </section>
  );
}
