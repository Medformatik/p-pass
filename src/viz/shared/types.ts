export type BaseVizProps = {
  width?: number;
  height?: number;
  controlled?: boolean;
  onParamChange?: (params: Record<string, number>) => void;
  animate?: boolean;
};
