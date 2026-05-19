import { useRef, useState, useMemo } from "react";
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

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

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

  function clientToData(clientX: number, clientY: number): [number, number] | null {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = clientX - rect.left - margin.left;
    const relY = clientY - rect.top - margin.top;
    if (relX < 0 || relX > innerW || relY < 0 || relY > innerH) return null;
    const x = xDomMin + (relX / innerW) * (xDomMax - xDomMin);
    const y = yDomMax - (relY / innerH) * (yDomMax - yDomMin);
    return [x, y];
  }

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
      <svg ref={svgRef} width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Axes */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="currentColor" opacity={0.4} />
          <line x1={0} x2={0} y1={0} y2={innerH} stroke="currentColor" opacity={0.4} />
          {/* Interactive background for click-to-add */}
          {!controlled && (
            <rect
              x={0}
              y={0}
              width={innerW}
              height={innerH}
              fill="transparent"
              onDoubleClick={(e) => {
                const c = clientToData(e.clientX, e.clientY);
                if (!c) return;
                setPoints((prev) => {
                  const next = [...prev, c];
                  setText(pointsToText(next));
                  return next;
                });
              }}
            />
          )}
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
            <circle
              key={i}
              cx={scaleX(x)}
              cy={scaleY(y)}
              r={dragIdx === i ? 6 : 4}
              fill={accent}
              opacity={dragIdx === i ? 1 : 0.85}
              style={{ cursor: controlled ? "default" : "grab" }}
              onPointerDown={
                controlled
                  ? undefined
                  : (e) => {
                      e.preventDefault();
                      (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
                      setDragIdx(i);
                    }
              }
              onPointerMove={
                controlled
                  ? undefined
                  : (e) => {
                      if (dragIdx !== i) return;
                      const c = clientToData(e.clientX, e.clientY);
                      if (!c) return;
                      setPoints((prev) => prev.map((p, j) => (j === i ? c : p)));
                    }
              }
              onPointerUp={
                controlled
                  ? undefined
                  : (e) => {
                      (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
                      setDragIdx(null);
                      setPoints((prev) => {
                        setText(pointsToText(prev));
                        return prev;
                      });
                    }
              }
              onDoubleClick={
                controlled
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      setPoints((prev) => {
                        const next = prev.filter((_, j) => j !== i);
                        setText(pointsToText(next));
                        return next;
                      });
                    }
              }
            />
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
      {!controlled && (
        <p className="mt-1 text-xs text-muted-foreground">
          Punkt ziehen, doppelklick zum Entfernen,
          doppelklick auf leere Fläche zum Hinzufügen.
        </p>
      )}
    </div>
  );
}
