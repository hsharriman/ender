import { SVGModes } from "../types/types";

export type BaseSVGProps = {
  geoId: string;
  mode: SVGModes;
  hoverable?: boolean;
  style?: React.CSSProperties;
  miniScale: boolean;
};

export interface BaseSVGState {
  isActive: boolean;
  css: string;
  isPinned?: boolean;
}
