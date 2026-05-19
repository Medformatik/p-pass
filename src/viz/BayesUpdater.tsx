import { useState } from "react";
import { motion } from "motion/react";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  prior?: number;
  sensitivity?: number;
  fpr?: number;
};

const LABELS = ["Prior P(K)", "Sensitivität P(+|K)", "FPR P(+|¬K)", "Posterior P(K|+)"];

export function BayesUpdater({
  prior: initialPrior = 0.1,
  sensitivity: initialSens = 0.95,
  fpr: initialFPR = 0.05,
  width = 400,
  height = 280,
  controlled,
}: Props) {
  const [prior, setPrior] = useState(initialPrior);
  const [sens, setSens] = useState(initialSens);
  const [fpr, setFPR] = useState(initialFPR);

  const denom = sens * prior + fpr * (1 - prior);
  const posterior = denom < 1e-12 ? 0 : (sens * prior) / denom;

  const values = [prior, sens, fpr, posterior];
  const margin = { top: 16, right: 12, bottom: 36, left: 12 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const barCount = 4;
  const barGap = 16;
  const barWidth = (innerW - barGap * (barCount - 1)) / barCount;
  const accent = getAccentColor();
  const aria = `Bayes-Update: Prior=${prior.toFixed(2)} → Posterior=${posterior.toFixed(2)}`;

  return (
    <div className="inline-block">
      <svg width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {values.map((v, i) => {
            const x = i * (barWidth + barGap);
            const barH = innerH * v;
            const isPosterior = i === 3;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={innerH}
                  fill={accent}
                  opacity={0.12}
                  rx={4}
                />
                <motion.rect
                  x={x}
                  width={barWidth}
                  fill={accent}
                  opacity={isPosterior ? 1 : 0.7}
                  initial={false}
                  animate={{ y: innerH - barH, height: barH }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={innerH + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  {LABELS[i]}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={innerH + 26}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {!controlled && (
        <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
          <label>
            Prior: {prior.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={prior}
              onChange={(e) => setPrior(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label>
            Sensitivität: {sens.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sens}
              onChange={(e) => setSens(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label>
            FPR: {fpr.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={fpr}
              onChange={(e) => setFPR(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      )}
    </div>
  );
}
