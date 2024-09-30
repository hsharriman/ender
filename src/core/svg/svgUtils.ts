import { SVGModes, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { ModeCSS } from "./SVGStyles";
import { AspectRatio } from "./svgTypes";

const SVG_SCALE = 30;
const SVG_DIM = 120;
const SVG_CANVAS_DIMS = [300, 350]; // short side, long side
const SVG_SQUARE_CANVAS_DIM = 300;

const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 30;
const MINI_SVG_XSHIFT = 20;

export const aspectSvgStr = (aspect: AspectRatio) => {
  return aspect === AspectRatio.Square
    ? `0 0 ${SVG_SQUARE_CANVAS_DIM} ${SVG_SQUARE_CANVAS_DIM}`
    : aspect === AspectRatio.Landscape
    ? `0 0 ${SVG_CANVAS_DIMS[1]} ${SVG_CANVAS_DIMS[0]}`
    : `0 0 ${SVG_CANVAS_DIMS[0]} ${SVG_CANVAS_DIMS[1]}`;
};

export const aspectSvgYDim = (aspect: AspectRatio) => {
  return aspect === AspectRatio.Square
    ? SVG_SQUARE_CANVAS_DIM
    : aspect === AspectRatio.Landscape
    ? SVG_CANVAS_DIMS[0]
    : SVG_CANVAS_DIMS[1];
};

export const aspectSvgContainer = (aspect: AspectRatio) => {
  return aspect === AspectRatio.Square
    ? [`${SVG_SQUARE_CANVAS_DIM}px`, `${SVG_SQUARE_CANVAS_DIM}px`]
    : aspect === AspectRatio.Landscape
    ? `0 0 ${SVG_CANVAS_DIMS[1]} ${SVG_CANVAS_DIMS[0]}`
    : `0 0 ${SVG_CANVAS_DIMS[0]} ${SVG_CANVAS_DIMS[1]}`;
};

// From EuclideanBuilder SVG Related
export const coordsToSvg = (
  coords: Vector,
  miniScale: boolean,
  // aspect: AspectRatio,
  offset: Vector = [0, 0]
): Vector => {
  // scale coordinates, shift and invert y axis
  // TODO scale the transformation based on canvas size
  const scale = miniScale ? MINI_SVG_SCALE : SVG_SCALE;
  // const xshift = miniScale ? MINI_SVG_XSHIFT : SVG_XSHIFT;
  // const yshift = miniScale ? MINI_SVG_YSHIFT : SVG_YSHIFT;
  // const dim = miniScale ? MINI_SVG_DIM : SVG_DIM;
  // const scale = 50;
  // const xshift = 50;
  // const yshift = 25;
  const xshift = 0;
  const yshift = 0;
  const dim = 320; // TODO this is brittle

  let vec = vops.add(vops.smul(coords, scale), [
    xshift + offset[0],
    yshift + offset[1],
  ]);
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

export const updateStyle = (mode: SVGModes) => {
  switch (mode) {
    case SVGModes.Active:
      return ModeCSS.ACTIVE;
    case SVGModes.Default:
      return ModeCSS.DEFAULT;
    case SVGModes.Focused:
      return ModeCSS.FOCUSED;
    case SVGModes.Unfocused:
      return ModeCSS.UNFOCUSED;
    case SVGModes.Purple:
      return ModeCSS.PURPLE;
    case SVGModes.Blue:
      return ModeCSS.BLUE;
    case SVGModes.Pinned:
      return ModeCSS.PINNED;
    case SVGModes.ActiveText:
      return ModeCSS.ACTIVETEXT;
    case SVGModes.ActiveTriangleBlue:
      return ModeCSS.ACTIVETRIBLUE;
    case SVGModes.ActiveTrianglePurple:
      return ModeCSS.ACTIVETRIPURPLE;
    case SVGModes.UnfocusedTriangle:
      return ModeCSS.UNFOCUSEDTRI;
    case SVGModes.Hidden:
    default:
      return ModeCSS.HIDDEN;
  }
};
