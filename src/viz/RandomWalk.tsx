import { useEffect, useRef, useState } from "react";
import { getAccentColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  dimension?: 1 | 2;
  steps?: number;
  bridge?: boolean;
};

function randn(): number {
  const u1 = Math.random() || 1e-12;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generate(dim: 1 | 2, steps: number, bridge: boolean): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  for (let i = 1; i <= steps; i++) {
    const prev = pts[i - 1];
    if (dim === 1) {
      pts.push({ x: i, y: prev.y + randn() });
    } else {
      pts.push({ x: prev.x + randn(), y: prev.y + randn() });
    }
  }
  if (bridge) {
    const end = pts[pts.length - 1];
    return pts.map((p, i) => {
      const t = i / steps;
      if (dim === 1) return { x: p.x, y: p.y - t * end.y };
      return { x: p.x - t * end.x, y: p.y - t * end.y };
    });
  }
  return pts;
}

export function RandomWalk({
  dimension = 1,
  steps = 500,
  bridge = false,
  width = 480,
  height = 280,
  controlled,
}: Props) {
  const [seed, setSeed] = useState(0);
  const [dim, setDim] = useState<1 | 2>(dimension);
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

    const pts = generate(dim, steps, bridge);
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.05 || 1;
    const yPad = (yMax - yMin) * 0.1 || 1;

    const margin = 16;
    const innerW = width - 2 * margin;
    const innerH = height - 2 * margin;

    const sx = (x: number) => margin + ((x - (xMin - xPad)) / (xMax - xMin + 2 * xPad)) * innerW;
    const sy = (y: number) => margin + innerH - ((y - (yMin - yPad)) / (yMax - yMin + 2 * yPad)) * innerH;

    const accent = getAccentColor();
    const DURATION = 3000;
    let frameId = 0;
    let restartTimer: number | undefined;
    const start = performance.now();

    function draw(progress: number) {
      const idx = Math.floor(progress * (pts.length - 1));
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = accent;
      ctx!.lineWidth = 1.5;
      ctx!.lineJoin = "round";
      ctx!.beginPath();
      ctx!.moveTo(sx(pts[0].x), sy(pts[0].y));
      for (let i = 1; i <= idx; i++) {
        ctx!.lineTo(sx(pts[i].x), sy(pts[i].y));
      }
      ctx!.stroke();

      // Start marker
      ctx!.fillStyle = accent;
      ctx!.beginPath();
      ctx!.arc(sx(pts[0].x), sy(pts[0].y), 3, 0, Math.PI * 2);
      ctx!.fill();
      // Head
      if (idx > 0) {
        ctx!.beginPath();
        ctx!.arc(sx(pts[idx].x), sy(pts[idx].y), 3, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / DURATION);
      draw(progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        restartTimer = window.setTimeout(() => setSeed((s) => s + 1), 1000);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      if (restartTimer !== undefined) clearTimeout(restartTimer);
    };
  }, [seed, dim, steps, bridge, width, height]);

  const aria = `Random Walk in ${dim}D mit ${steps} Schritten${bridge ? " (Bridge)" : ""}`;

  return (
    <div className="inline-block">
      <canvas ref={canvasRef} role="img" aria-label={aria} />
      {!controlled && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1">
            Dimension:
            <select
              value={dim}
              onChange={(e) => setDim(Number(e.target.value) as 1 | 2)}
              className="border-2 border-border rounded-md px-2 py-0.5 bg-bg"
            >
              <option value={1}>1D</option>
              <option value={2}>2D</option>
            </select>
          </label>
          <span className="text-muted-foreground">Schritte: {steps}</span>
        </div>
      )}
    </div>
  );
}
