import { useEffect, useMemo, useState } from "react";
import { getAccentColor, getInkColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  states?: string[];
  transitions?: number[][];
};

const DEFAULT_STATES = ["A", "B", "C"];
const DEFAULT_TRANSITIONS = [
  [0.5, 0.3, 0.2],
  [0.2, 0.6, 0.2],
  [0.3, 0.3, 0.4],
];

function pickNext(row: number[]): number {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < row.length; i++) {
    acc += row[i];
    if (r <= acc) return i;
  }
  return row.length - 1;
}

export function MarkovChain({
  states = DEFAULT_STATES,
  transitions = DEFAULT_TRANSITIONS,
  width = 360,
  height = 320,
  controlled,
}: Props) {
  const [current, setCurrent] = useState(0);

  const positions = useMemo(() => {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) * 0.34;
    return states.map((_, i) => {
      const theta = (i / states.length) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
    });
  }, [states.length, width, height]);

  useEffect(() => {
    if (states.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((c) => pickNext(transitions[c] ?? []));
    }, 1200);
    return () => clearInterval(interval);
  }, [transitions, states.length]);

  const accent = getAccentColor();
  const ink = getInkColor();
  const NODE_R = 20;

  // For curved arrows: midpoint + perpendicular offset
  function arrowPath(i: number, j: number): { d: string; mid: { x: number; y: number } } {
    if (i === j) {
      // Self-loop
      const p = positions[i];
      const offset = NODE_R + 16;
      return {
        d: `M ${p.x - 8},${p.y - NODE_R} C ${p.x - offset},${p.y - offset} ${p.x + offset},${p.y - offset} ${p.x + 8},${p.y - NODE_R}`,
        mid: { x: p.x, y: p.y - offset - 4 },
      };
    }
    const a = positions[i];
    const b = positions[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // shorten by node radius from both ends
    const nx = dx / len;
    const ny = dy / len;
    const sx = a.x + nx * NODE_R;
    const sy = a.y + ny * NODE_R;
    const ex = b.x - nx * NODE_R;
    const ey = b.y - ny * NODE_R;
    // Curve control point: midpoint + perpendicular offset
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const px = -ny;
    const py = nx;
    const curve = 26;
    const cx = mx + px * curve;
    const cy = my + py * curve;
    return {
      d: `M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`,
      mid: { x: cx, y: cy },
    };
  }

  const aria = `Markov-Kette mit ${states.length} Zuständen, aktueller Zustand ${states[current]}`;

  return (
    <div className="inline-block">
      <svg width={width} height={height} role="img" aria-label={aria}>
        <defs>
          <marker id="mc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0,0 L 10,5 L 0,10 Z" fill={accent} />
          </marker>
        </defs>
        {/* Arrows */}
        {transitions.flatMap((row, i) =>
          row.map((p, j) => {
            if (p <= 0.001) return null;
            const { d, mid } = arrowPath(i, j);
            return (
              <g key={`${i}-${j}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1 + 3 * p}
                  opacity={0.7}
                  markerEnd="url(#mc-arrow)"
                />
                <text x={mid.x} y={mid.y} fontSize={9} fill={ink} opacity={0.7} textAnchor="middle">
                  {p.toFixed(2)}
                </text>
              </g>
            );
          })
        )}
        {/* Nodes */}
        {positions.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={NODE_R}
              fill={i === current ? accent : "transparent"}
              stroke={accent}
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fontSize={14}
              fill={i === current ? "var(--brand-on-accent)" : ink}
              fontWeight={600}
            >
              {states[i]}
            </text>
          </g>
        ))}
      </svg>
      {!controlled && (
        <div className="mt-2 text-xs font-mono">
          Aktuell: <strong>{states[current]}</strong>
        </div>
      )}
    </div>
  );
}
