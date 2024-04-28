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

export enum LinkedSymbolType {
  Segment = "segment",
  Triangle = "triangle",
  Angle = "angle",
}

export type TickType =
  | Obj.ParallelTick
  | Obj.EqualLengthTick
  | Obj.EqualAngleTick
  | Obj.HiddenTick
  | Obj.RightTick;

export enum SVGModes {
  Hidden = "hidden",
  Focused = "focused",
  Active = "active",
  Unfocused = "unfocused",
  Default = "default",
  Purple = "purple",
  Blue = "blue",
}

export interface ProofTextItem {
  k: string;
  v: JSX.Element;
  reason?: string;
  dependsOn?: Set<string>;
  alwaysActive?: boolean;
}

export interface StaticProofTextItem {
  stmt: JSX.Element;
  reason?: string;
}

export interface Reason {
  title: string;
  body: string;
}
