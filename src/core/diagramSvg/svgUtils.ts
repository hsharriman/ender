import { SVGModes, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { ModeCSS } from "./SVGStyles";

const SVG_SCALE = 30;

const MINI_SVG_SCALE = 30;

// From EuclideanBuilder SVG Related
export const coordsToSvg = (
  coords: Vector,
  miniScale: boolean,
  offset: Vector = [0, 0]
): Vector => {
  // scale coordinates, shift and invert y axis
  const scale = miniScale ? MINI_SVG_SCALE : SVG_SCALE;
  const dim = 320; // TODO this is brittle

  let vec = vops.add(vops.smul(coords, scale), offset);
  return [vec[0], dim - vec[1]];
};

export const scaleToSvg = (n: number, miniScale: boolean) =>
  n * (miniScale ? MINI_SVG_SCALE : SVG_SCALE);

// true if arc should sweep CCW
export const arcSweepsCCW = (
  center: Vector,
  start: Vector,
  end: Vector
): number => {
  const st = vops.unit(vops.sub(start, center));
  const en = vops.unit(vops.sub(end, center));
  const cross = vops.cross(st, en);
  return cross > 0 ? 0 : 1;
};

// TODO combine SVGModes and ModeCSS
export const updateStyle = (mode: SVGModes, fill?: boolean) => {
  switch (mode) {
    case SVGModes.Default:
      return fill ? ModeCSS.HIDDEN : ModeCSS.DEFAULT;
    case SVGModes.Unfocused:
      return fill ? ModeCSS.UNFOCUSEDFILL : ModeCSS.UNFOCUSED;
    case SVGModes.ReliesOn:
      return fill ? ModeCSS.RELIESFILL : ModeCSS.RELIES;
    case SVGModes.Derived:
      return fill ? ModeCSS.DERIVEDFILL : ModeCSS.DERIVED;
    case SVGModes.Inconsistent:
      return fill ? ModeCSS.INCONSISTENTFILL : ModeCSS.INCONSISTENT;
    case SVGModes.Hidden:
    default:
      return ModeCSS.HIDDEN;
  }
};
