import { Obj } from "geometry-object";
import {
  AngleBuilder,
  ArcBuilder,
  CircleBuilder,
  PointBuilder,
  QuadrilateralBuilder,
  SegmentBuilder,
  TriangleBuilder,
} from "../builder/GeoObjectBuilders";

export type TickType =
  | Obj.ParallelTick
  | Obj.EqualLengthTick
  | Obj.EqualAngleTick
  | Obj.RightTick
  | Obj.SimilarTick
  | Obj.AngleHighlight;

export enum SVGModes {
  Hidden = "hidden",
  Unfocused = "unfocused",
  Default = "default",
  ReliesOn = "relieson",
  Derived = "derived",
  Inconsistent = "inconsistent",
  /** A fact the step needed that nothing before it establishes. */
  Unestablished = "unestablished",
}
// for determining what type of styling to apply to an object
export enum HighlightType {
  Relies = "relies",
  ReliesUnmet = "reliesunmet",
  Highlight = "highlight",
  HighlightUnmet = "highlightunmet",
}

export enum AspectRatio {
  Square = "square",
  Wide = "wide",
  Tall = "tall",
  Landscape = "landscape",
}

export enum ShowPoint {
  Always = "always",
  Adaptive = "adaptive",
  Hide = "hide",
}

export type DiagramRenderCtx = {
  points: PointBuilder[];
  segments: SegmentBuilder[];
  angles: AngleBuilder[];
  triangles: TriangleBuilder[];
  quads: QuadrilateralBuilder[];
  circles: CircleBuilder[];
  arcs: ArcBuilder[];
  frames: string[];
  deps: Map<string, Set<string>>;
};

export type GeoBuilderObject =
  | PointBuilder
  | SegmentBuilder
  | AngleBuilder
  | TriangleBuilder
  | QuadrilateralBuilder
  | CircleBuilder;

export type TickedGeoObject = SegmentBuilder | AngleBuilder;
