import { useEffect, useState } from "react";
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

function circularLayout(n: number, width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.34;
  return Array.from({ length: n }, (_, i) => {
    const theta = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  });
}

export function MarkovChain({
  states = DEFAULT_STATES,
  transitions = DEFAULT_TRANSITIONS,
  width = 360,
  height = 320,
  controlled,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [internalStates, setInternalStates] = useState<string[]>(states);
  const [internalT, setInternalT] = useState<number[][]>(transitions);
  const [dragNode, setDragNode] = useState<number | null>(null);
  const [editingEdge, setEditingEdge] = useState<[number, number] | null>(null);

  const [positions, setPositions] = useState(() =>
    circularLayout(states.length, width, height),
  );

  const effectiveStates = controlled ? states : internalStates;
  const effectiveT = controlled ? transitions : internalT;

  // Reset positions when state count changes (uncontrolled grows/shrinks) or in controlled mode
  useEffect(() => {
    if (positions.length !== effectiveStates.length) {
      setPositions(circularLayout(effectiveStates.length, width, height));
    }
  }, [effectiveStates.length, width, height, positions.length]);

  // Clamp current within bounds
  useEffect(() => {
    if (current >= effectiveStates.length) {
      setCurrent(0);
    }
  }, [current, effectiveStates.length]);

  useEffect(() => {
    if (effectiveStates.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((c) => {
        const safeC = c >= effectiveT.length ? 0 : c;
        const row = effectiveT[safeC];
        if (!row || row.length === 0) return safeC;
        return pickNext(row);
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [effectiveT, effectiveStates.length]);

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

  function commitEdge(i: number, j: number, newP: number) {
    if (!Number.isFinite(newP)) {
      setEditingEdge(null);
      return;
    }
    const clamped = Math.max(0, Math.min(1, newP));
    setInternalT((prev) => {
      const row = [...prev[i]];
      row[j] = clamped;
      const otherSum = row.reduce((s, v, k) => (k === j ? s : s + v), 0);
      const target = 1 - clamped;
      if (otherSum > 0) {
        for (let k = 0; k < row.length; k++) {
          if (k !== j) row[k] = (row[k] / otherSum) * target;
        }
      } else {
        // distribute remaining among others uniformly
        const others = row.length - 1;
        if (others > 0) {
          for (let k = 0; k < row.length; k++) {
            if (k !== j) row[k] = target / others;
          }
        }
      }
      return prev.map((r, k) => (k === i ? row : r));
    });
    setEditingEdge(null);
  }

  function addState() {
    const n = internalStates.length;
    if (n >= 6) return;
    const newLabel = String.fromCharCode(65 + n); // 'A' + n
    setInternalStates([...internalStates, newLabel]);
    setInternalT((prev) => {
      // grow each existing row by 1 column, renormalize
      const newRows = prev.map((row) => {
        const grown = [...row, 0];
        const sum = grown.reduce((s, v) => s + v, 0);
        return sum > 0 ? grown.map((v) => v / sum) : grown.map(() => 1 / grown.length);
      });
      // add new row: uniform distribution
      const newRow = new Array(n + 1).fill(1 / (n + 1));
      return [...newRows, newRow];
    });
  }

  function removeState(idx: number) {
    if (internalStates.length <= 2) return;
    setInternalStates((prev) => prev.filter((_, i) => i !== idx));
    setInternalT((prev) => {
      const trimmed = prev
        .filter((_, i) => i !== idx)
        .map((row) => row.filter((_, j) => j !== idx));
      // renormalize each row
      return trimmed.map((row) => {
        const sum = row.reduce((s, v) => s + v, 0);
        return sum > 0 ? row.map((v) => v / sum) : row.map(() => 1 / row.length);
      });
    });
    // Reset current state if it pointed to removed
    setCurrent((c) => (c >= internalStates.length - 1 ? 0 : c));
  }

  const safeCurrent = current < effectiveStates.length ? current : 0;
  const aria = `Markov-Kette mit ${effectiveStates.length} Zuständen, aktueller Zustand ${effectiveStates[safeCurrent]}`;

  // Guard: if positions haven't synced with state count yet, skip rendering nodes/arrows safely
  const positionsReady = positions.length === effectiveStates.length;

  return (
    <div className="inline-block">
      <svg width={width} height={height} role="img" aria-label={aria}>
        <defs>
          <marker id="mc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0,0 L 10,5 L 0,10 Z" fill={accent} />
          </marker>
        </defs>
        {/* Arrows */}
        {positionsReady &&
          effectiveT.flatMap((row, i) =>
            row.map((p, j) => {
              if (p <= 0.001 && !(editingEdge && editingEdge[0] === i && editingEdge[1] === j)) {
                return null;
              }
              const { d, mid } = arrowPath(i, j);
              const isEditing = editingEdge && editingEdge[0] === i && editingEdge[1] === j;
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
                  {isEditing ? (
                    <foreignObject x={mid.x - 20} y={mid.y - 10} width={40} height={20}>
                      <input
                        type="number"
                        step="0.05"
                        min={0}
                        max={1}
                        defaultValue={p.toFixed(2)}
                        autoFocus
                        onBlur={(e) => commitEdge(i, j, parseFloat(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            commitEdge(i, j, parseFloat((e.target as HTMLInputElement).value));
                          if (e.key === "Escape") setEditingEdge(null);
                        }}
                        className="w-full text-xs bg-bg border border-border rounded px-1"
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={mid.x}
                      y={mid.y}
                      fontSize={9}
                      fill={ink}
                      opacity={0.7}
                      textAnchor="middle"
                      style={{ cursor: controlled ? "default" : "pointer" }}
                      onClick={() => !controlled && setEditingEdge([i, j])}
                    >
                      {p.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            }),
          )}
        {/* Nodes */}
        {positionsReady &&
          positions.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE_R}
                fill={i === safeCurrent ? accent : "transparent"}
                stroke={accent}
                strokeWidth={2}
                style={{ cursor: controlled ? "default" : "grab" }}
                onPointerDown={
                  controlled
                    ? undefined
                    : (e) => {
                        e.preventDefault();
                        (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
                        setDragNode(i);
                      }
                }
                onPointerMove={
                  controlled
                    ? undefined
                    : (e) => {
                        if (dragNode !== i) return;
                        const svgEl = (e.target as SVGCircleElement).ownerSVGElement;
                        if (!svgEl) return;
                        const rect = svgEl.getBoundingClientRect();
                        setPositions((prev) =>
                          prev.map((pos, j) =>
                            j === i
                              ? { x: e.clientX - rect.left, y: e.clientY - rect.top }
                              : pos,
                          ),
                        );
                      }
                }
                onPointerUp={
                  controlled
                    ? undefined
                    : (e) => {
                        (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
                        setDragNode(null);
                      }
                }
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={14}
                fill={i === safeCurrent ? "var(--brand-on-accent)" : ink}
                fontWeight={600}
                pointerEvents="none"
              >
                {effectiveStates[i]}
              </text>
            </g>
          ))}
      </svg>
      {!controlled && (
        <div className="mt-2 text-xs font-mono">
          Aktuell: <strong>{effectiveStates[safeCurrent]}</strong>
        </div>
      )}
      {!controlled && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => addState()}
            disabled={internalStates.length >= 6}
            className="underline text-accent disabled:opacity-50"
          >
            + Zustand
          </button>
          <button
            type="button"
            onClick={() => removeState(internalStates.length - 1)}
            disabled={internalStates.length <= 2}
            className="underline text-accent disabled:opacity-50"
          >
            − Zustand
          </button>
          <span className="text-muted-foreground">
            Knoten ziehen, Wahrscheinlichkeit anklicken zum Bearbeiten
          </span>
        </div>
      )}
    </div>
  );
}
