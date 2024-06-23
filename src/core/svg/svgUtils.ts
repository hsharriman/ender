import { Vector } from "../types/types";
import { vops } from "../vectorOps";

const TICK_SCALE = 20;
const SVG_SCALE = 60;
const SVG_DIM = 120;

const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 25;
const MINI_SVG_XSHIFT = 20;

// From EuclideanBuilder SVG Related
export const coordsToSvg = (
  coords: Vector,
  miniScale: boolean,
  offset: Vector = [0, 0]
): Vector => {
  // scale coordinates, shift and invert y axis
  // TODO scale the transformation based on canvas size
  // const scale = miniScale ? MINI_SVG_SCALE : SVG_SCALE;
  // const xshift = miniScale ? MINI_SVG_XSHIFT : SVG_XSHIFT;
  // const yshift = miniScale ? MINI_SVG_YSHIFT : SVG_YSHIFT;
  // const dim = miniScale ? MINI_SVG_DIM : SVG_DIM;
  const scale = 50;
  const xshift = 50;
  const yshift = 25;
  const dim = 250;

  let vec = vops.add(vops.smul(coords, scale), [
    xshift + offset[0],
    yshift + offset[1],
  ]);
  return [vec[0], dim - vec[1]];
};

export const scaleToSvg = (n: number, miniScale: boolean) =>
  n * (miniScale ? MINI_SVG_SCALE : SVG_SCALE);
