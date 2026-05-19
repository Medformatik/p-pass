import { useState } from "react";
import { scaleLinear } from "d3-scale";
import { line as d3line } from "d3-shape";
import { range as d3range } from "d3-array";
import { normalPDF, normalCDF } from "@/stats/distributions";
import { getAccentColor, getWrongColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  mu0?: number;
  mu1?: number;
  sigma?: number;
  alpha?: number;
};

function zCritical(alpha: number, mu: number, sigma: number): number {
  let z = 1;
  for (let i = 0; i < 30; i++) {
    const F = normalCDF(z, 0, 1);
    const f = normalPDF(z, 0, 1);
    if (f < 1e-9) break;
    z -= (F - (1 - alpha)) / f;
  }
  return mu + z * sigma;
}

export function HypothesisTest({
  mu0: initialMu0 = 0,
  mu1: initialMu1 = 2,
  sigma: initialSigma = 1,
  alpha: initialAlpha = 0.05,
  width = 480,
  height = 280,
  controlled,
}: Props) {
  const [mu1, setMu1] = useState(initialMu1);
  const [sigma, setSigma] = useState(initialSigma);
  const [alpha, setAlpha] = useState(initialAlpha);
  const mu0 = initialMu0; // keep mu0 fixed for simplicity

  const c = zCritical(alpha, mu0, sigma);
  const beta = normalCDF(c, mu1, sigma);
  const power = 1 - beta;

  const accent = getAccentColor();
  const wrong = getWrongColor();

  const margin = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xMin = Math.min(mu0, mu1) - 4 * sigma;
  const xMax = Math.max(mu0, mu1) + 4 * sigma;
  const xs = d3range(xMin, xMax, (xMax - xMin) / 200);
  const peakDensity = normalPDF(mu0, mu0, sigma);
  const yMax = peakDensity * 1.05;

  const xScale = scaleLinear().domain([xMin, xMax]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, yMax]).range([innerH, 0]);
  const line = d3line<[number, number]>()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]));

  const h0 = xs.map((x): [number, number] => [x, normalPDF(x, mu0, sigma)]);
  const h1 = xs.map((x): [number, number] => [x, normalPDF(x, mu1, sigma)]);
  const alphaArea = xs
    .filter((x) => x >= c)
    .map((x): [number, number] => [x, normalPDF(x, mu0, sigma)]);
  const betaArea = xs
    .filter((x) => x <= c)
    .map((x): [number, number] => [x, normalPDF(x, mu1, sigma)]);

  const areaToPath = (pts: [number, number][]) => {
    if (pts.length === 0) return "";
    const first = `M ${xScale(pts[0][0])},${yScale(0)}`;
    const top = pts.map((p) => `L ${xScale(p[0])},${yScale(p[1])}`).join(" ");
    const close = `L ${xScale(pts[pts.length - 1][0])},${yScale(0)} Z`;
    return `${first} ${top} ${close}`;
  };

  const cX = xScale(c);
  const aria = `Hypothesentest: μ0=${mu0}, μ1=${mu1.toFixed(2)}, σ=${sigma.toFixed(2)}, α=${alpha.toFixed(2)}, Power=${power.toFixed(2)}`;

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
          <path d={areaToPath(alphaArea)} fill={wrong} opacity={0.3} />
          <path d={areaToPath(betaArea)} fill={accent} opacity={0.2} />
          <path
            d={line(h0) ?? ""}
            stroke={accent}
            fill="none"
            strokeWidth={1.5}
          />
          <path
            d={line(h1) ?? ""}
            stroke={wrong}
            fill="none"
            strokeWidth={1.5}
          />
          <line
            x1={cX}
            x2={cX}
            y1={0}
            y2={innerH}
            stroke="currentColor"
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <text x={cX + 4} y={12} fontSize={10} fill="currentColor" opacity={0.7}>
            c = {c.toFixed(2)}
          </text>
          <line
            x1={0}
            x2={innerW}
            y1={innerH}
            y2={innerH}
            stroke="currentColor"
            opacity={0.3}
          />
        </g>
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs font-mono">
        <span>α = {alpha.toFixed(3)}</span>
        <span>β = {beta.toFixed(3)}</span>
        <span>
          Power = <strong>{power.toFixed(2)}</strong>
        </span>
      </div>
      {!controlled && (
        <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
          <label>
            μ1: {mu1.toFixed(2)}
            <input
              type="range"
              min={-3}
              max={5}
              step={0.05}
              value={mu1}
              onChange={(e) => setMu1(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label>
            σ: {sigma.toFixed(2)}
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.05}
              value={sigma}
              onChange={(e) => setSigma(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label>
            α: {alpha.toFixed(2)}
            <input
              type="range"
              min={0.01}
              max={0.2}
              step={0.005}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      )}
    </div>
  );
}
