import { useEffect, useState } from "react";

export type NumberTickerProps = {
  value: number;
  durationMs?: number;
  format?: (n: number) => string;
  className?: string;
};

export function NumberTicker({ value, durationMs = 600, format, className }: NumberTickerProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const from = display;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>;
}
