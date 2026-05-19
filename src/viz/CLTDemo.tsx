import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type DistName = "uniform" | "exponential" | "bernoulli";

type Props = BaseVizProps & {
  distribution?: DistName;
  n?: number;
  trials?: number;
};

const DIST_LABELS: Record<DistName, string> = {
  uniform: "Gleichverteilung U(0,1)",
  exponential: "Exponential Exp(1)",
  bernoulli: "Bernoulli p=0.3",
};

function sample(dist: DistName): number {
  switch (dist) {
    case "uniform":
      return Math.random();
    case "exponential": {
      const u = Math.random() || 1e-12;
      return -Math.log(u);
    }
    case "bernoulli":
      return Math.random() < 0.3 ? 1 : 0;
  }
}

export function CLTDemo({
  distribution: initialDist = "uniform",
  n: initialN = 30,
  trials = 2000,
  width = 480,
  height = 280,
  controlled,
}: Props) {
  const [dist, setDist] = useState<DistName>(initialDist);
  const [n, setN] = useState(initialN);
  const [seed, setSeed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const accent = getAccentColor();
    const means: number[] = [];
    for (let i = 0; i < trials; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += sample(dist);
      means.push(s / n);
    }

    const minM = Math.min(...means);
    const maxM = Math.max(...means);
    const span = maxM - minM || 1;
    const numBins = 40;
    const binSize = span / numBins;
    const bins = new Array<number>(numBins).fill(0);
    for (const m of means) {
      const idx = Math.min(numBins - 1, Math.floor((m - minM) / binSize));
      bins[idx]++;
    }
    const maxCount = Math.max(...bins, 1);

    const margin = { top: 12, right: 12, bottom: 24, left: 12 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const barW = innerW / numBins;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = accent;
    for (let i = 0; i < numBins; i++) {
      const h = (bins[i] / maxCount) * innerH;
      ctx.fillRect(margin.left + i * barW + 1, margin.top + innerH - h, barW - 2, h);
    }
    // Axis
    ctx.strokeStyle = "rgba(125,125,125,0.5)";
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + innerH);
    ctx.lineTo(margin.left + innerW, margin.top + innerH);
    ctx.stroke();

    // Tick labels (min, mean, max)
    const meanM = means.reduce((s, v) => s + v, 0) / means.length;
    ctx.fillStyle = "rgba(150,150,150,0.9)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(minM.toFixed(2), margin.left, height - 4);
    ctx.fillText(meanM.toFixed(2), margin.left + innerW / 2, height - 4);
    ctx.fillText(maxM.toFixed(2), margin.left + innerW, height - 4);
  }, [dist, n, trials, seed, width, height]);

  const aria = `CLT-Demo: ${trials} Mittelwerte aus ${dist}-Stichproben der Größe n=${n}`;

  return (
    <div className="inline-block">
      <canvas ref={canvasRef} role="img" aria-label={aria} />
      {!controlled && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            Quelle:
            <select
              value={dist}
              onChange={(e) => setDist(e.target.value as DistName)}
              className="border-2 border-border rounded-md px-2 py-0.5 bg-bg"
            >
              {(Object.keys(DIST_LABELS) as DistName[]).map((d) => (
                <option key={d} value={d}>
                  {DIST_LABELS[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1">
            n: {n}
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
            Neu
          </Button>
        </div>
      )}
    </div>
  );
}
