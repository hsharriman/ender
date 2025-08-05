import { SVGModes } from "../types/types";
export type BaseSVGProps = {
    geoId: string;
    mode: SVGModes;
    hoverable?: boolean;
    isHighlight: boolean;
    style?: React.CSSProperties;
    miniScale: boolean;
};
export interface BaseSVGState {
    isActive: boolean;
    css: string;
    isPinned?: boolean;
}
export declare enum AspectRatio {
    Portrait = "portrait",
    Landscape = "landscape",
    Square = "square"
}
//# sourceMappingURL=svgTypes.d.ts.map