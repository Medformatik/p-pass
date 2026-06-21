import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import type { VizSpec } from "@/questions/types";

type AnyProps = Record<string, unknown>;

// Each viz exports a NAMED component (matching its name), so we adapt to
// React.lazy's default-export convention.
const VIZ_LOADERS: Record<string, () => Promise<Record<string, unknown>>> = {
  GaltonBoard: () => import("./GaltonBoard"),
  BinomialPMF: () => import("./BinomialPMF"),
  BayesUpdater: () => import("./BayesUpdater"),
  BayesTree: () => import("./BayesTree"),
  ConfidenceInterval: () => import("./ConfidenceInterval"),
  HypothesisTest: () => import("./HypothesisTest"),
  PoissonProcess: () => import("./PoissonProcess"),
  LorenzGini: () => import("./LorenzGini"),
  Boxplot: () => import("./Boxplot"),
  Regression: () => import("./Regression"),
  CLTDemo: () => import("./CLTDemo"),
  RandomWalk: () => import("./RandomWalk"),
  MarkovChain: () => import("./MarkovChain"),
};

const LAZY_CACHE: Record<string, ComponentType<AnyProps>> = {};

function getLazy(name: string): ComponentType<AnyProps> | undefined {
  if (!VIZ_LOADERS[name]) return undefined;
  if (!LAZY_CACHE[name]) {
    LAZY_CACHE[name] = lazy(async () => {
      const mod = await VIZ_LOADERS[name]();
      const Component = mod[name] as ComponentType<AnyProps>;
      return { default: Component };
    });
  }
  return LAZY_CACHE[name];
}

function useResponsiveSize(maxW: number, maxH: number) {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return { w: maxW, h: maxH };
    const vw = window.innerWidth;
    const w = Math.min(maxW, vw - 48);
    const h = Math.round((w / maxW) * maxH);
    return { w, h };
  });
  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const w = Math.min(maxW, vw - 48);
      const h = Math.round((w / maxW) * maxH);
      setSize({ w, h });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [maxW, maxH]);
  return size;
}

export type VizSlotProps = {
  spec?: VizSpec;
  width?: number;
  height?: number;
  controlled?: boolean;
};

export function VizSlot({
  spec,
  width = 360,
  height = 280,
  controlled = true,
}: VizSlotProps) {
  const size = useResponsiveSize(width, height);
  if (!spec) {
    return <div className="text-muted-foreground text-sm">(keine Visualisierung)</div>;
  }
  const Comp = getLazy(spec.component);
  if (!Comp) {
    return <div className="text-muted-foreground text-sm">Unbekannte Viz: {spec.component}</div>;
  }
  return (
    <Suspense
      fallback={
        <div
          className="rounded-md bg-muted animate-pulse"
          style={{ width: size.w, height: size.h }}
          aria-label="Visualisierung wird geladen"
        />
      }
    >
      <Comp {...spec.props} width={size.w} height={size.h} controlled={controlled} />
    </Suspense>
  );
}
