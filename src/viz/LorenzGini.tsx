import { useState, useMemo } from "react";
import { getAccentColor, getWrongColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  values?: number[];
};

const DEFAULT_VALUES = [1, 2, 3, 5, 8, 13, 21, 34];

function computeLorenz(values: number[]): { points: { x: number; y: number }[]; gini: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total <= 0 || n === 0) {
    return { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], gini: 0 };
  }
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    cum += sorted[i];
    points.push({ x: (i + 1) / n, y: cum / total });
  }
  let areaUnderCurve = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    areaUnderCurve += 0.5 * (points[i].y + points[i + 1].y) * dx;
  }
  const gini = 1 - 2 * areaUnderCurve;
  return { points, gini };
}

export function LorenzGini({
  values: initialValues = DEFAULT_VALUES,
  width = 320,
  height = 320,
  controlled,
}: Props) {
  const [values, setValues] = useState<number[]>(initialValues);
  const [text, setText] = useState(initialValues.join(", "));

  const { points, gini } = useMemo(() => computeLorenz(values), [values]);

  const margin = { top: 12, right: 12, bottom: 28, left: 36 };
  const size = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom);
  const innerW = size;
  const innerH = size;

  const scaleX = (x: number) => x * innerW;
  const scaleY = (y: number) => innerH - y * innerH;

  const accent = getAccentColor();
  const wrong = getWrongColor();

  const linePath =
    `M ${scaleX(points[0].x)},${scaleY(points[0].y)} ` +
    points.slice(1).map((p) => `L ${scaleX(p.x)},${scaleY(p.y)}`).join(" ");

  const areaPath =
    `M ${scaleX(0)},${scaleY(0)} L ${scaleX(1)},${scaleY(1)} ` +
    points.slice().reverse().map((p) => `L ${scaleX(p.x)},${scaleY(p.y)}`).join(" ") +
    " Z";

  function commitText(s: string) {
    const parsed = s
      .split(",")
      .map((t) => Number(t.trim()))
      .filter((v) => Number.isFinite(v) && v >= 0);
    if (parsed.length >= 2) setValues(parsed);
  }

  const aria = `Lorenz-Kurve mit Gini-Koeffizient ${gini.toFixed(3)} bei ${values.length} Werten`;

  return (
    <div className="inline-block">
      <svg width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Gini gap area */}
          <path d={areaPath} fill={wrong} opacity={0.2} />
          {/* Equality line */}
          <line x1={scaleX(0)} y1={scaleY(0)} x2={scaleX(1)} y2={scaleY(1)} stroke="currentColor" opacity={0.4} strokeDasharray="3 3" />
          {/* Lorenz curve */}
          <path d={linePath} stroke={accent} strokeWidth={2} fill="none" />
          {/* Axes */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="currentColor" opacity={0.4} />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="currentColor" opacity={0.4} />
          {[0, 0.5, 1].map((t) => (
            <g key={`xt${t}`}>
              <text x={scaleX(t)} y={innerH + 14} fontSize={10} fill="currentColor" textAnchor="middle" opacity={0.7}>
                {t}
              </text>
              <text x={-6} y={scaleY(t) + 3} fontSize={10} fill="currentColor" textAnchor="end" opacity={0.7}>
                {t}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div className="mt-2 text-sm font-mono">
        Gini: <strong>{gini.toFixed(3)}</strong>
      </div>
      {!controlled && (
        <label className="mt-2 block text-xs">
          Werte (komma-getrennt):
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
