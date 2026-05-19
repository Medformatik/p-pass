import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAccentColor, getWrongColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  mu?: number; // true mean, default 0
  sigma?: number; // true std, default 1
  n?: number; // sample size, default 30
  confidence?: number; // 0..1, default 0.95
  numSamples?: number; // default 100
};

// MVP: critical value hard-coded for 95% confidence.
// A future iteration may swap this for an inverse-normal approximation (e.g. Acklam)
// to support arbitrary `confidence` values.
const Z_95 = 1.96;

function randn(mu = 0, sigma = 1): number {
  const u1 = Math.random() || 1e-12;
  const u2 = Math.random();
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type SampleCI = { mean: number; lo: number; hi: number; contains: boolean };

function generate(
  mu: number,
  sigma: number,
  n: number,
  numSamples: number,
): SampleCI[] {
  const z = Z_95;
  const se = sigma / Math.sqrt(n);
  const results: SampleCI[] = [];
  for (let i = 0; i < numSamples; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += randn(mu, sigma);
    const mean = sum / n;
    const lo = mean - z * se;
    const hi = mean + z * se;
    results.push({ mean, lo, hi, contains: lo <= mu && mu <= hi });
  }
  return results;
}

export function ConfidenceInterval({
  mu = 0,
  sigma = 1,
  n = 30,
  confidence = 0.95,
  numSamples = 100,
  width = 400,
  height = 360,
  controlled,
}: Props) {
  // `confidence` is currently fixed to 95% for the MVP (z = 1.96).
  // Reference it to silence unused-variable warnings without changing behaviour.
  void confidence;

  const [seed, setSeed] = useState(0);
  const samples = useMemo(
    () => generate(mu, sigma, n, numSamples),
    [mu, sigma, n, numSamples, seed],
  );

  const accent = getAccentColor();
  const wrong = getWrongColor();
  const coverage =
    samples.length === 0
      ? 0
      : samples.filter((s) => s.contains).length / samples.length;

  const margin = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const se = sigma / Math.sqrt(n);
  const xMin = mu - 4 * se;
  const xMax = mu + 4 * se;
  const xScale = (v: number) => ((v - xMin) / (xMax - xMin)) * innerW;
  const yScale = (i: number) =>
    numSamples <= 1 ? innerH / 2 : (i / (numSamples - 1)) * innerH;

  const muX = xScale(mu);
  const coveragePct = (coverage * 100).toFixed(0);
  const aria = `${numSamples} simulierte Stichproben mit ${(confidence * 100).toFixed(0)}% Konfidenzintervallen für μ=${mu}; Coverage=${coveragePct}%`;

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
          <line
            x1={muX}
            x2={muX}
            y1={0}
            y2={innerH}
            stroke="currentColor"
            opacity={0.4}
            strokeDasharray="3 3"
          />
          {samples.map((s, i) => (
            <line
              key={i}
              x1={xScale(s.lo)}
              x2={xScale(s.hi)}
              y1={yScale(i)}
              y2={yScale(i)}
              stroke={s.contains ? accent : wrong}
              strokeWidth={1}
              opacity={0.75}
            />
          ))}
          <text
            x={muX + 4}
            y={-2}
            fontSize={10}
            fill="currentColor"
            opacity={0.7}
          >
            μ = {mu}
          </text>
        </g>
      </svg>
      <div className="mt-2 flex items-center gap-3 text-sm">
        <span className="font-mono">
          Coverage: <strong>{coveragePct}%</strong>
        </span>
        {!controlled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSeed((s) => s + 1)}
          >
            Neu samplen
          </Button>
        )}
      </div>
    </div>
  );
}
