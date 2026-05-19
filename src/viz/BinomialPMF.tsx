import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { binomialPMF } from "@/stats/distributions";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  n?: number;
  p?: number;
  highlight?: number;
};

export function BinomialPMF({
  n: initialN = 10,
  p: initialP = 0.5,
  highlight,
  width = 400,
  height = 280,
  controlled,
}: Props) {
  const [n, setN] = useState(initialN);
  const [p, setP] = useState(initialP);
  const xAxisRef = useRef<SVGGElement | null>(null);
  const yAxisRef = useRef<SVGGElement | null>(null);

  const margin = { top: 10, right: 12, bottom: 28, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const ks = Array.from({ length: n + 1 }, (_, k) => k);
  const probs = ks.map((k) => binomialPMF(n, k, p));
  const maxP = Math.max(...probs, 0.01);

  const x = d3.scaleBand<number>().domain(ks).range([0, innerW]).padding(0.1);
  const y = d3.scaleLinear().domain([0, maxP]).nice().range([innerH, 0]);

  useEffect(() => {
    if (xAxisRef.current) {
      const tickEvery = n > 15 ? 2 : 1;
      const ax = d3
        .axisBottom(x)
        .tickValues(ks.filter((k) => k % tickEvery === 0))
        .tickFormat((k) => String(k));
      d3.select(xAxisRef.current).call(ax as never);
    }
    if (yAxisRef.current) {
      const ay = d3.axisLeft(y).ticks(4).tickFormat(d3.format(".2f"));
      d3.select(yAxisRef.current).call(ay as never);
    }
  }, [n, p, x, y, ks]);

  const accent = getAccentColor();
  const aria = `Binomialverteilung mit n=${n}, p=${p.toFixed(2)}`;

  return (
    <div className="inline-block">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={aria}
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {ks.map((k) => {
            const isHi = highlight === k;
            const bx = x(k)!;
            const by = y(probs[k]);
            return (
              <rect
                key={k}
                x={bx}
                y={by}
                width={x.bandwidth()}
                height={innerH - by}
                fill={accent}
                opacity={highlight === undefined ? 1 : isHi ? 1 : 0.6}
              />
            );
          })}
          <g ref={xAxisRef} transform={`translate(0,${innerH})`} />
          <g ref={yAxisRef} />
        </g>
      </svg>
      {!controlled && (
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <label>
            n: {n}
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label>
            p: {p.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      )}
    </div>
  );
}
