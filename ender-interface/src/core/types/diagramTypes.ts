import { Obj } from "geometry-object";
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
