import { useEffect, useRef, useState } from "react";
import { getAccentColor, getInkColor } from "./shared/colors";
import type { BaseVizProps } from "./shared/types";

type Props = BaseVizProps & {
  lambda?: number;
};

export function PoissonProcess({
  lambda: initialLambda = 2,
  width = 480,
  height = 200,
  controlled,
}: Props) {
  const [lambda, setLambda] = useState(initialLambda);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const eventsRef = useRef<number[]>([]);
  const lambdaRef = useRef(lambda);
  lambdaRef.current = lambda;
  const [count, setCount] = useState(0);

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
    const ink = getInkColor();
    let lastTime = performance.now();
    let frameId = 0;
    const WINDOW_MS = 10000;
    const baseY = height / 2;

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Generate events
      const lam = lambdaRef.current;
      if (Math.random() < lam * dt) {
        eventsRef.current.push(now);
      }

      // Cull old
      const cutoff = now - WINDOW_MS;
      while (eventsRef.current.length > 0 && eventsRef.current[0] < cutoff) {
        eventsRef.current.shift();
      }

      // Render
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = ink;
      ctx!.globalAlpha = 0.3;
      ctx!.beginPath();
      ctx!.moveTo(0, baseY);
      ctx!.lineTo(width, baseY);
      ctx!.stroke();
      ctx!.globalAlpha = 1;

      ctx!.strokeStyle = accent;
      ctx!.lineWidth = 2;
      for (const t of eventsRef.current) {
        const x = ((t - cutoff) / WINDOW_MS) * width;
        ctx!.beginPath();
        ctx!.moveTo(x, baseY - 22);
        ctx!.lineTo(x, baseY + 22);
        ctx!.stroke();
      }

      setCount(eventsRef.current.length);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [width, height]);

  const aria = `Poisson-Prozess mit Rate λ=${lambda}, ${count} Events im 10s-Fenster`;

  return (
    <div className="inline-block">
      <canvas ref={canvasRef} role="img" aria-label={aria} />
      <div className="mt-2 flex items-center gap-3 text-xs font-mono">
        <span>λ = {lambda.toFixed(1)} /s</span>
        <span>{count} Events / 10s</span>
      </div>
      {!controlled && (
        <label className="mt-1 block text-xs">
          λ: {lambda.toFixed(1)}
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            className="w-full"
          />
        </label>
      )}
    </div>
  );
}
