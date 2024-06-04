import { InPlaceLayoutProps } from "../../components/layouts/InPlaceLayout";
import { StaticLayoutProps } from "../../components/layouts/StaticLayout";

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
  Focused = "focused",
  Active = "active",
  Unfocused = "unfocused",
  Default = "default",
  Purple = "purple",
  Blue = "blue",
}

// -------- TYPES RELATED TO PROOF SETUP --------
export type LayoutProps = InPlaceLayoutProps & StaticLayoutProps;

export interface Reason {
  title: string;
  body: string;
}
