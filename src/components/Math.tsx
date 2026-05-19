import { useEffect, useRef } from "react";
import katex from "katex";

type Props = {
  tex: string;
  display?: boolean;
  className?: string;
};

export function Math({ tex, display, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, {
        displayMode: !!display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = tex;
    }
  }, [tex, display]);

  return <span ref={ref} className={className} aria-label={tex} />;
}
