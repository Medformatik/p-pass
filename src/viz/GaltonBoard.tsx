import { useEffect, useRef } from "react";

export type GaltonBoardProps = {
  n: number;
  p: number;
  balls?: number;
  width?: number;
  height?: number;
  highlight?: number;
};

type Ball = {
  x: number;
  y: number;
  vy: number;
  bin: number;
  row: number;
  done: boolean;
};

export function GaltonBoard({
  n,
  p,
  balls = 1000,
  width = 600,
  height = 400,
  highlight,
}: GaltonBoardProps) {
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

    const pegSpacingX = width / (n + 2);
    const pegSpacingY = (height * 0.6) / (n + 1);
    const startX = width / 2;
    const startY = pegSpacingY * 0.5;
    const binAreaTop = startY + pegSpacingY * (n + 1);
    const binAreaHeight = height - binAreaTop - 10;
    const binWidth = width / (n + 1);

    const bins = new Array<number>(n + 1).fill(0);
    const active: Ball[] = [];
    let spawned = 0;
    let frameId = 0;
    const accentColor =
      getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() ||
      "#33b3a5";

    function spawn() {
      if (spawned >= balls) return;
      active.push({ x: startX, y: startY, vy: 1.2, bin: 0, row: 0, done: false });
      spawned++;
    }

    function tick() {
      ctx!.clearRect(0, 0, width, height);

      // pegs
      ctx!.fillStyle = accentColor;
      ctx!.globalAlpha = 0.18;
      for (let row = 0; row < n; row++) {
        for (let col = 0; col <= row; col++) {
          const px = startX + (col - row / 2) * pegSpacingX;
          const py = startY + (row + 1) * pegSpacingY;
          ctx!.beginPath();
          ctx!.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;

      // bins
      const maxBin = Math.max(...bins, 1);
      for (let i = 0; i < bins.length; i++) {
        const h = (bins[i] / maxBin) * binAreaHeight;
        const x = i * binWidth;
        const y = height - 10 - h;
        ctx!.fillStyle = highlight === i ? accentColor : accentColor + "55";
        ctx!.fillRect(x + 2, y, binWidth - 4, h);
      }

      // physics
      for (let i = active.length - 1; i >= 0; i--) {
        const b = active[i];
        if (b.done) continue;
        b.y += b.vy;
        b.vy = Math.min(b.vy + 0.05, 3);

        if (b.row < n && b.y >= startY + (b.row + 1) * pegSpacingY) {
          const left = Math.random() > p;
          if (left) {
            b.x -= pegSpacingX / 2;
          } else {
            b.x += pegSpacingX / 2;
            b.bin++;
          }
          b.row++;
        }

        if (b.row >= n && b.y >= binAreaTop) {
          bins[b.bin]++;
          b.done = true;
          active.splice(i, 1);
          continue;
        }

        ctx!.fillStyle = accentColor;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (let s = 0; s < 2 && spawned < balls; s++) spawn();

      if (spawned < balls || active.length > 0) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [n, p, balls, width, height, highlight]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Galton-Brett mit n=${n} Reihen, p=${p}, ${balls} Kugeln`}
    />
  );
}
