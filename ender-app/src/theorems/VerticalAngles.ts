import { Angle } from "../core/geometry/Angle";
import { Obj, SVGModes } from "../core/types";

export const VerticalAngleTheorem = (
  frame: string,
  a1: Angle,
  a2: Angle,
  a1Mode: SVGModes,
  a2Mode: SVGModes
) => {
  // a1 = a1.addTick(frame, Obj.EqualAngleTick).mode(frame, a1Mode);
  // a2 = a2.addTick(frame, Obj.EqualAngleTick).mode(frame, a2Mode);
  return [a1, a2];
};
