import { Vector } from "geometry-object";
import { SVGModes } from "../types/diagramTypes";
import { vops } from "../vectorOps";
import { ModeCSS } from "./SVGStyles";

const SVG_SCALE = 30;

const MINI_SVG_SCALE = 30;

// From EuclideanBuilder SVG Related
export const coordsToSvg = (
  coords: Vector,
  miniScale: boolean,
  offset: Vector = [0, 0],
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
  end: Vector,
): number => {
  const st = vops.unit(vops.sub(start, center));
  const en = vops.unit(vops.sub(end, center));
  const cross = vops.cross(st, en);
  return cross > 0 ? 0 : 1;
};

/**
 * The large-arc and sweep flags of the SVG arc from `start` to `end` around
 * `center`, all in SVG coordinates.  The arc goes the way round that misses
 * `avoid`; without `avoid` it is the minor arc.
 */
export const arcFlags = (
  center: Vector,
  start: Vector,
  end: Vector,
  avoid?: Vector,
): { major: number; sweep: number } => {
  const angle = (p: Vector) => Math.atan2(p[1] - center[1], p[0] - center[0]);
  // How far round from a to b in the direction sweep-flag 1 draws.
  const turn = (a: Vector, b: Vector) =>
    (angle(b) - angle(a) + 2 * Math.PI) % (2 * Math.PI);
  const span = turn(start, end);
  const sweep = avoid
    ? turn(start, avoid) < span
      ? 0
      : 1
    : span < Math.PI
      ? 1
      : 0;
  const length = sweep ? span : 2 * Math.PI - span;
  return { major: length > Math.PI ? 1 : 0, sweep };
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
    case SVGModes.Unestablished:
      return fill ? ModeCSS.UNESTABLISHEDFILL : ModeCSS.UNESTABLISHED;
    case SVGModes.Hidden:
    default:
      return ModeCSS.HIDDEN;
  }
};

// https://stackoverflow.com/questions/9960908/permutations-in-javascript
export const permutator = (inputArr: string[]): string[] => {
  let result: string[] = [];
  const permute = (arr: string[], m: string = "") => {
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice(); // copy arr
        let next = curr.splice(i, 1);
        permute(curr.slice(), m + next);
      }
    }
  };
  permute(inputArr);
  return result;
};
