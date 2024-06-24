import { SVGModes } from "../types/types";

export type BaseSVGProps = {
  geoId: string;
  mode: SVGModes;
  hoverable?: boolean;
  style?: React.CSSProperties;
};

export interface BaseSVGState {
  isActive: boolean;
  css: string;
  isPinned?: boolean;
}
