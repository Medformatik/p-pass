import { useEffect, useRef } from "react";

/**
 * Wraps children and renders a hand-drawn underline as an SVG path.
 * Animates the stroke from 0% to 100% on mount.
 */
export function InkUnderline({
  children,
  color = "currentColor",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    if (typeof path.getTotalLength !== "function") return; // jsdom fallback
    const len = path.getTotalLength();
    if (!Number.isFinite(len) || len === 0) return; // jsdom fallback
    path.style.transition = "none";
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    // Force a reflow so the transition picks up
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 0.8s cubic-bezier(0.65, 0, 0.35, 1)";
    path.style.strokeDashoffset = "0";
  }, []);

  return (
    <span className="relative inline-block">
      {children}
      <svg
        className="absolute inset-x-0 -bottom-1 w-full pointer-events-none"
        height="6"
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M 1 4 Q 25 1 50 3 T 99 4"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
