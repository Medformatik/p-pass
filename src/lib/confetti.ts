type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rot: number;
  vr: number;
  size: number;
};

const PALETTE = ["#33b3a5", "#c2a64a", "#e07a3e", "#7e8ae0", "#d063a8", "#5fb3d6"];

export function burstConfetti(count = 80, durationMs = 1500): void {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 3;
  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: cx,
    y: cy,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 12 - 4,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.4,
    size: 4 + Math.random() * 4,
  }));

  const start = performance.now();
  function frame(now: number) {
    const elapsed = now - start;
    if (elapsed > durationMs) {
      canvas.remove();
      return;
    }
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx!.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
