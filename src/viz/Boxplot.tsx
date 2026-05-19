import { useState, useMemo, useRef } from "react";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  data?: number[];
};

const DEFAULT = [3, 7, 8, 5, 12, 14, 21, 13, 18, 9, 6, 4, 28];

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function summarize(data: number[]) {
  if (data.length === 0) {
    return { min: 0, q1: 0, med: 0, q3: 0, max: 0, whiskerLo: 0, whiskerHi: 0, outliers: [] as number[] };
  }
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const med = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const inRange = sorted.filter((v) => v >= lowerFence && v <= upperFence);
  const whiskerLo = inRange[0] ?? q1;
  const whiskerHi = inRange[inRange.length - 1] ?? q3;
  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  return { min: sorted[0], q1, med, q3, max: sorted[sorted.length - 1], whiskerLo, whiskerHi, outliers };
}

export function Boxplot({
  data: initialData = DEFAULT,
  width = 480,
  height = 160,
  controlled,
}: Props) {
  const [data, setData] = useState<number[]>(initialData);
  const [text, setText] = useState(initialData.join(", "));
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const stats = useMemo(() => summarize(data), [data]);

  const margin = { top: 20, right: 16, bottom: 28, left: 16 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allValues = [stats.min, stats.max, ...stats.outliers];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const span = maxV - minV || 1;
  const pad = span * 0.1;
  const xMin = minV - pad;
  const xMax = maxV + pad;
  const scaleX = (v: number) => ((v - xMin) / (xMax - xMin)) * innerW;

  const accent = getAccentColor();
  const midY = innerH / 2;
  const boxTop = midY - 22;
  const boxBot = midY + 22;

  function commitText(s: string) {
    const parsed = s
      .split(",")
      .map((t) => Number(t.trim()))
      .filter((v) => Number.isFinite(v));
    if (parsed.length >= 2) setData(parsed);
  }

  const aria = `Boxplot mit Median=${stats.med.toFixed(1)}, Q1=${stats.q1.toFixed(1)}, Q3=${stats.q3.toFixed(1)}, ${stats.outliers.length} Ausreißer`;

  return (
    <div className="inline-block">
      <svg ref={svgRef} width={width} height={height} role="img" aria-label={aria} style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Whiskers */}
          <line x1={scaleX(stats.whiskerLo)} x2={scaleX(stats.q1)} y1={midY} y2={midY} stroke={accent} strokeWidth={1.5} />
          <line x1={scaleX(stats.q3)} x2={scaleX(stats.whiskerHi)} y1={midY} y2={midY} stroke={accent} strokeWidth={1.5} />
          {/* Whisker caps */}
          <line x1={scaleX(stats.whiskerLo)} x2={scaleX(stats.whiskerLo)} y1={midY - 8} y2={midY + 8} stroke={accent} strokeWidth={1.5} />
          <line x1={scaleX(stats.whiskerHi)} x2={scaleX(stats.whiskerHi)} y1={midY - 8} y2={midY + 8} stroke={accent} strokeWidth={1.5} />
          {/* Box */}
          <rect
            x={scaleX(stats.q1)}
            y={boxTop}
            width={scaleX(stats.q3) - scaleX(stats.q1)}
            height={boxBot - boxTop}
            fill={accent}
            opacity={0.18}
            stroke={accent}
            strokeWidth={1.5}
          />
          {/* Median */}
          <line x1={scaleX(stats.med)} x2={scaleX(stats.med)} y1={boxTop} y2={boxBot} stroke={accent} strokeWidth={2.5} />
          {/* Outliers */}
          {stats.outliers.map((v, i) => (
            <circle key={i} cx={scaleX(v)} cy={midY} r={3} fill="none" stroke={accent} strokeWidth={1.5} />
          ))}
          {/* X-axis */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="currentColor" opacity={0.3} />
          {[xMin, stats.med, xMax].map((t, i) => (
            <text key={i} x={scaleX(t)} y={innerH + 14} fontSize={10} fill="currentColor" textAnchor="middle" opacity={0.7}>
              {t.toFixed(1)}
            </text>
          ))}
          {/* Editable layer (only when not controlled) */}
          {!controlled && (
            <>
              {/* Background rect for double-click-to-add */}
              <rect
                x={0}
                y={0}
                width={innerW}
                height={innerH}
                fill="transparent"
                onDoubleClick={(e) => {
                  if (!svgRef.current) return;
                  const rect = svgRef.current.getBoundingClientRect();
                  const relX = e.clientX - rect.left - margin.left;
                  const t = relX / innerW;
                  const newVal = xMin + t * (xMax - xMin);
                  if (Number.isFinite(newVal)) {
                    setData((prev) => [...prev, newVal]);
                    setText((prev) => `${prev}, ${newVal.toFixed(2)}`);
                  }
                }}
              />
              {/* Draggable data points */}
              {data.map((v, i) => (
                <circle
                  key={i}
                  cx={scaleX(v)}
                  cy={innerH - 4}
                  r={5}
                  fill={accent}
                  opacity={draggingIdx === i ? 1 : 0.65}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
                    setDraggingIdx(i);
                  }}
                  onPointerMove={(e) => {
                    if (draggingIdx !== i) return;
                    if (!svgRef.current) return;
                    const rect = svgRef.current.getBoundingClientRect();
                    const relX = e.clientX - rect.left - margin.left;
                    const t = Math.max(0, Math.min(1, relX / innerW));
                    const newVal = xMin + t * (xMax - xMin);
                    setData((prev) => prev.map((v0, j) => (j === i ? newVal : v0)));
                  }}
                  onPointerUp={(e) => {
                    (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
                    setDraggingIdx(null);
                    setText(data.map((v) => v.toFixed(2)).join(", "));
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation(); // don't fall through to background rect
                    setData((prev) => prev.filter((_, j) => j !== i));
                  }}
                />
              ))}
            </>
          )}
        </g>
      </svg>
      <div className="mt-2 text-xs font-mono space-x-3">
        <span>Q1: {stats.q1.toFixed(2)}</span>
        <span>Med: {stats.med.toFixed(2)}</span>
        <span>Q3: {stats.q3.toFixed(2)}</span>
        <span>IQR: {(stats.q3 - stats.q1).toFixed(2)}</span>
      </div>
      {!controlled && (
        <label className="mt-2 block text-xs">
          Daten (komma-getrennt):
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
          Punkt ziehen zum Verschieben, doppelklick zum Entfernen,
          doppelklick auf leere Fläche zum Hinzufügen.
        </p>
      )}
    </div>
  );
}
