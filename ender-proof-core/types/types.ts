// -------- GEOMETRY TYPES --------
export type Vector = [number, number];
export type LPoint = { pt: Vector; label: string };
export type LSegment = { p1: Vector; p2: Vector; label: string };
export type LAngle = {
  center: Vector;
  start: Vector;
  end: Vector;
  label: string;
};

export enum Obj {
  Point = "point",
  Segment = "segment",
  Text = "text",
  // Circle,
  Angle = "angle",
  ParallelTick = "parallel",
  EqualLengthTick = "equallength",
  Triangle = "triangle",
  EqualAngleTick = "equalangle",
  Tick = "tick",
  HiddenTick = "hiddentick",
  RightTick = "righttick",
  Quadrilateral = "rectangle",
}

export type TickType =
  | Obj.ParallelTick
  | Obj.EqualLengthTick
  | Obj.EqualAngleTick
  | Obj.HiddenTick
  | Obj.RightTick;

export enum SVGModes {
  Hidden = "hidden",
  Unfocused = "unfocused",
  Default = "default",
  ReliesOn = "relieson",
  Derived = "derived",
  Inconsistent = "inconsistent",
}
// for determining what type of styling to apply to an object
export enum HighlightType {
  Relies = "relies",
  ReliesUnmet = "reliesunmet",
  Highlight = "highlight",
  HighlightUnmet = "highlightunmet",
}

// Define AspectRatio locally since we removed diagramSvg
export enum AspectRatio {
  Square = "square",
  Wide = "wide",
  Tall = "tall",
  Landscape = "landscape",
}
export interface Stmt {
  function: string;
  arguments: string[];
  stepNumber?: string;
}

export interface Reason {
  function: string;
  arguments: string[];
}

export interface ParseObj {
  type: Obj.Point | Obj.Segment | Obj.Angle | Obj.Triangle | Obj.Quadrilateral;
  label: string;
}
