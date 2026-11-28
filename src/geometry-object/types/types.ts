// -------- GEOMETRY TYPES --------
export type Vector = [number, number];

export enum Obj {
  Point = "point",
  Segment = "segment",
  Text = "text",
  Angle = "angle",
  ParallelTick = "parallel",
  EqualLengthTick = "equallength",
  Triangle = "triangle",
  Arc = "arc",
  EqualAngleTick = "equalangle",
  Tick = "tick",
  RightTick = "righttick",
  Quadrilateral = "rectangle",
  Circle = "circle",
  SimilarTick = "similartick",
  AngleHighlight = "highlight",
}

export interface ParseObj {
  type:
    | Obj.Point
    | Obj.Segment
    | Obj.Angle
    | Obj.Triangle
    | Obj.Quadrilateral
    | Obj.Circle
    // A minor arc `r_OAB`, kept as its letters `OAB`: centre, then ends.
    | Obj.Arc
    // An argument with no drawable object, kept as its source text, such
    // as a nested call.
    | Obj.Text;
  v: string;
}

// -------- DISPLAY STATE --------
// Every object records, per frame of a proof walkthrough, how it is drawn.

export type TickType =
  | Obj.ParallelTick
  | Obj.EqualLengthTick
  | Obj.EqualAngleTick
  | Obj.RightTick
  | Obj.SimilarTick
  | Obj.AngleHighlight;

export type Tick = { type: TickType; num: number };

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

export enum ShowPoint {
  Always = "always",
  Adaptive = "adaptive",
  Hide = "hide",
}
