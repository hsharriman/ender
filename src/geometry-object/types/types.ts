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
export type LCircle = {
  center: Vector;
  radius: Vector;
  label: string;
};

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
  HiddenTick = "hiddentick",
  RightTick = "righttick",
  Quadrilateral = "rectangle",
  Circle = "circle",
  SimilarTick = "similartick",
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
