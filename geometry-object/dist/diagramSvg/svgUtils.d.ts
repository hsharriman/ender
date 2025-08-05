import { SVGModes, Vector } from "../types/types";
export declare const coordsToSvg: (coords: Vector, miniScale: boolean, offset?: Vector) => Vector;
export declare const scaleToSvg: (n: number, miniScale: boolean) => number;
export declare const arcSweepsCCW: (center: Vector, start: Vector, end: Vector) => number;
export declare const updateStyle: (mode: SVGModes, fill?: boolean) => string;
//# sourceMappingURL=svgUtils.d.ts.map