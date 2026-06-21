import { motion } from "motion/react";
import { getAccentColor, getCorrectColor, getWrongColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  /** P(A) — Wahrscheinlichkeit für erstes Ereignis (z. B. krank). */
  prior?: number;
  /** P(B|A) — Wahrscheinlichkeit zweites Ereignis gegeben A (z. B. Test +). */
  condIfA?: number;
  /** P(B|¬A) — Wahrscheinlichkeit zweites Ereignis gegeben ¬A. */
  condIfNotA?: number;
  /** Labels: [A, ¬A, B, ¬B]; etwa ["krank","gesund","+","−"]. */
  labels?: [string, string, string, string];
  /** Index der zu hervorhebenden Leaf (0..3) — meist für „P(A∩B)" relevant. */
  highlightLeaf?: number;
};

export function BayesTree({
  prior = 0.1,
  condIfA = 0.9,
  condIfNotA = 0.1,
  labels = ["A", "¬A", "B", "¬B"],
  highlightLeaf,
  width = 380,
  height = 260,
}: Props) {
  const accent = getAccentColor();
  const correct = getCorrectColor();
  const wrong = getWrongColor();

  const margin = { top: 14, right: 90, bottom: 14, left: 14 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // Layout: root → 2 first-level nodes → 4 leaves
  const rootX = 0;
  const lvl1X = innerW * 0.35;
  const leafX = innerW;

  const lvl1Ys = [innerH * 0.22, innerH * 0.78];
  const leafYs = [innerH * 0.08, innerH * 0.36, innerH * 0.64, innerH * 0.92];

  const probs = [
    prior * condIfA,
    prior * (1 - condIfA),
    (1 - prior) * condIfNotA,
    (1 - prior) * (1 - condIfNotA),
  ];

  const [labA, labNotA, labB, labNotB] = labels;
  const leafLabels = [
    `${labA} ∩ ${labB}`,
    `${labA} ∩ ${labNotB}`,
    `${labNotA} ∩ ${labB}`,
    `${labNotA} ∩ ${labNotB}`,
  ];

  const branchProbs = [
    prior,
    1 - prior,
    condIfA,
    1 - condIfA,
    condIfNotA,
    1 - condIfNotA,
  ];

  // Branch edges: (from, to, probLabel)
  const edges: Array<{ x1: number; y1: number; x2: number; y2: number; label: string; color: string }> = [
    { x1: rootX, y1: innerH / 2, x2: lvl1X, y2: lvl1Ys[0], label: `${branchProbs[0].toFixed(2)}`, color: accent },
    { x1: rootX, y1: innerH / 2, x2: lvl1X, y2: lvl1Ys[1], label: `${branchProbs[1].toFixed(2)}`, color: accent },
    { x1: lvl1X, y1: lvl1Ys[0], x2: leafX, y2: leafYs[0], label: `${branchProbs[2].toFixed(2)}`, color: correct },
    { x1: lvl1X, y1: lvl1Ys[0], x2: leafX, y2: leafYs[1], label: `${branchProbs[3].toFixed(2)}`, color: wrong },
    { x1: lvl1X, y1: lvl1Ys[1], x2: leafX, y2: leafYs[2], label: `${branchProbs[4].toFixed(2)}`, color: correct },
    { x1: lvl1X, y1: lvl1Ys[1], x2: leafX, y2: leafYs[3], label: `${branchProbs[5].toFixed(2)}`, color: wrong },
  ];

  const aria = `Wahrscheinlichkeitsbaum: P(${labA})=${prior.toFixed(2)}, P(${labB}|${labA})=${condIfA.toFixed(2)}, P(${labB}|${labNotA})=${condIfNotA.toFixed(2)}`;

  return (
    <svg width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Edges */}
        {edges.map((e, i) => (
          <g key={`e-${i}`}>
            <motion.line
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.color}
              strokeWidth={1.4}
              opacity={0.7}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            />
            <text
              x={(e.x1 + e.x2) / 2}
              y={(e.y1 + e.y2) / 2 - 4}
              fontSize={10}
              fill="currentColor"
              opacity={0.75}
              textAnchor="middle"
            >
              {e.label}
            </text>
          </g>
        ))}

        {/* Root node */}
        <circle cx={rootX} cy={innerH / 2} r={4} fill={accent} />

        {/* Level-1 nodes with labels */}
        <g>
          <circle cx={lvl1X} cy={lvl1Ys[0]} r={5} fill={accent} />
          <text
            x={lvl1X + 8}
            y={lvl1Ys[0] - 4}
            fontSize={11}
            fill="currentColor"
            opacity={0.85}
          >
            {labA}
          </text>
          <circle cx={lvl1X} cy={lvl1Ys[1]} r={5} fill={accent} opacity={0.5} />
          <text
            x={lvl1X + 8}
            y={lvl1Ys[1] - 4}
            fontSize={11}
            fill="currentColor"
            opacity={0.85}
          >
            {labNotA}
          </text>
        </g>

        {/* Leaves with joint probabilities */}
        {probs.map((p, i) => {
          const isHL = highlightLeaf === i;
          return (
            <g key={`leaf-${i}`}>
              <circle
                cx={leafX}
                cy={leafYs[i]}
                r={isHL ? 6 : 4}
                fill={isHL ? accent : "currentColor"}
                opacity={isHL ? 1 : 0.5}
              />
              <text
                x={leafX + 8}
                y={leafYs[i] - 2}
                fontSize={11}
                fill="currentColor"
                fontWeight={isHL ? 600 : 400}
                opacity={isHL ? 1 : 0.85}
              >
                {leafLabels[i]}
              </text>
              <text
                x={leafX + 8}
                y={leafYs[i] + 12}
                fontSize={10}
                fill="currentColor"
                opacity={0.7}
              >
                = {p.toFixed(4)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
