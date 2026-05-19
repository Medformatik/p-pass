import type { ComponentType } from "react";
import type { VizSpec } from "@/questions/types";
import { GaltonBoard } from "./GaltonBoard";
import { BinomialPMF } from "./BinomialPMF";
import { BayesUpdater } from "./BayesUpdater";
import { ConfidenceInterval } from "./ConfidenceInterval";
import { HypothesisTest } from "./HypothesisTest";
import { PoissonProcess } from "./PoissonProcess";
import { LorenzGini } from "./LorenzGini";
import { Boxplot } from "./Boxplot";
import { Regression } from "./Regression";
import { CLTDemo } from "./CLTDemo";
import { RandomWalk } from "./RandomWalk";
import { MarkovChain } from "./MarkovChain";

type AnyProps = Record<string, unknown>;

const VIZ_COMPONENTS: Record<string, ComponentType<AnyProps>> = {
  GaltonBoard: GaltonBoard as unknown as ComponentType<AnyProps>,
  BinomialPMF: BinomialPMF as unknown as ComponentType<AnyProps>,
  BayesUpdater: BayesUpdater as unknown as ComponentType<AnyProps>,
  ConfidenceInterval: ConfidenceInterval as unknown as ComponentType<AnyProps>,
  HypothesisTest: HypothesisTest as unknown as ComponentType<AnyProps>,
  PoissonProcess: PoissonProcess as unknown as ComponentType<AnyProps>,
  LorenzGini: LorenzGini as unknown as ComponentType<AnyProps>,
  Boxplot: Boxplot as unknown as ComponentType<AnyProps>,
  Regression: Regression as unknown as ComponentType<AnyProps>,
  CLTDemo: CLTDemo as unknown as ComponentType<AnyProps>,
  RandomWalk: RandomWalk as unknown as ComponentType<AnyProps>,
  MarkovChain: MarkovChain as unknown as ComponentType<AnyProps>,
};

export type VizSlotProps = {
  spec?: VizSpec;
  width?: number;
  height?: number;
  controlled?: boolean;
};

export function VizSlot({ spec, width = 360, height = 280, controlled = true }: VizSlotProps) {
  if (!spec) {
    return <div className="text-muted-foreground text-sm">(keine Visualisierung)</div>;
  }
  const Comp = VIZ_COMPONENTS[spec.component];
  if (!Comp) {
    return <div className="text-muted-foreground text-sm">Unbekannte Viz: {spec.component}</div>;
  }
  return <Comp {...spec.props} width={width} height={height} controlled={controlled} />;
}
