import { useState, useMemo } from "react";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  points?: [number, number][];
};

const DEFAULT: [number, number][] = [
  [1, 2.1], [2, 3.8], [3, 6.1], [4, 7.9],
  [5, 10.4], [6, 11.7], [7, 14.2], [8, 15.8],
];

function regress(points: [number, number][]) {
  if (points.length < 2) return { beta0: 0, beta1: 0, r2: 0 };
  const n = points.length;
  const xbar = points.reduce((s, [x]) => s + x, 0) / n;
  const ybar = points.reduce((s, [, y]) => s + y, 0) / n;
  let num = 0, den = 0, sst = 0;
  for (const [x, y] of points) {
    num += (x - xbar) * (y - ybar);
    den += (x - xbar) ** 2;
    sst += (y - ybar) ** 2;
  }
  const beta1 = den < 1e-12 ? 0 : num / den;
  const beta0 = ybar - beta1 * xbar;
  let ssr = 0;
  for (const [x, y] of points) ssr += (y - (beta0 + beta1 * x)) ** 2;
  const r2 = sst < 1e-12 ? 0 : 1 - ssr / sst;
  return { beta0, beta1, r2 };
}

function pointsToText(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join("; ");
}

function parsePoints(s: string): [number, number][] | null {
  const out: [number, number][] = [];
  for (const pair of s.split(";")) {
    const parts = pair.split(",").map((t) => Number(t.trim()));
    if (parts.length !== 2 || !parts.every(Number.isFinite)) continue;
    out.push([parts[0], parts[1]]);
  }
  return out.length >= 2 ? out : null;
}

export function Regression({
  points: initial = DEFAULT,
  width = 420,
  height = 280,
  controlled,
}: Props) {
  const [points, setPoints] = useState<[number, number][]>(initial);
  const [text, setText] = useState(pointsToText(initial));

  const { beta0, beta1, r2 } = useMemo(() => regress(points), [points]);

  const margin = { top: 12, right: 12, bottom: 32, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xPad = (xMax - xMin) * 0.1 || 1;
  const yPad = (yMax - yMin) * 0.1 || 1;
  const xDomMin = xMin - xPad;
  const xDomMax = xMax + xPad;
  const yDomMin = yMin - yPad;
  const yDomMax = yMax + yPad;

  const scaleX = (x: number) => ((x - xDomMin) / (xDomMax - xDomMin)) * innerW;
  const scaleY = (y: number) => innerH - ((y - yDomMin) / (yDomMax - yDomMin)) * innerH;

  const accent = getAccentColor();

  const lineX1 = xDomMin;
  const lineX2 = xDomMax;
  const lineY1 = beta0 + beta1 * lineX1;
  const lineY2 = beta0 + beta1 * lineX2;

  function commitText(s: string) {
    const parsed = parsePoints(s);
    if (parsed) setPoints(parsed);
  }

  const aria = `Regression: y = ${beta0.toFixed(2)} + ${beta1.toFixed(2)} · x, R² = ${r2.toFixed(2)}`;

  return (
    <div className="inline-block">
      <svg width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Axes */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="currentColor" opacity={0.4} />
          <line x1={0} x2={0} y1={0} y2={innerH} stroke="currentColor" opacity={0.4} />
          {/* Regression line */}
          <line
            x1={scaleX(lineX1)}
            x2={scaleX(lineX2)}
            y1={scaleY(lineY1)}
            y2={scaleY(lineY2)}
            stroke={accent}
            strokeWidth={2}
          />
          {/* Points */}
          {points.map(([x, y], i) => (
            <circle key={i} cx={scaleX(x)} cy={scaleY(y)} r={3.5} fill={accent} />
          ))}
        </g>
      </svg>
      <div className="mt-2 text-xs font-mono space-x-3">
        <span>β₀ = {beta0.toFixed(3)}</span>
        <span>β₁ = {beta1.toFixed(3)}</span>
        <span>R² = {r2.toFixed(3)}</span>
      </div>
      {!controlled && (
        <label className="mt-2 block text-xs">
          Punkte (x,y; x,y; ...):
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText(e.currentTarget.value);
            }}
            className="mt-1 w-full border-2 border-border rounded-md px-2 py-1 bg-bg"
          />
        </label>
      )}
    </div>
  );
}
