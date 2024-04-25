import { congruent } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { SVGModes, Obj } from "../../core/types";
import { linked } from "../utils";

export class EqualAngles {
  static additions = (
    ctx: Content,
    [a1, a2]: [string, string],
    frame: string,
    a1Mode: SVGModes,
    a2Mode: SVGModes,
    inPlace = true,
    numTicks = 1
  ) => {
    const a1a = ctx.getAngle(a1);
    const a2a = ctx.getAngle(a2);
    const options = inPlace ? { num: numTicks } : { frame, num: numTicks };
    ctx.pushTick(a1a, Obj.EqualAngleTick, options).mode(frame, a1Mode);
    ctx.pushTick(a2a, Obj.EqualAngleTick, options).mode(frame, a2Mode);
    return ctx;
  };
  static text = (
    ctx: Content,
    [a1, a2]: [string, string],
    options?: { frame?: string; num?: number }
  ) => {
    const a1a = ctx.getAngle(a1);
    const a2a = ctx.getAngle(a2);
    return (
      <span>
        {linked(a1, a1a, [ctx.getTick(a1a, Obj.EqualAngleTick, options)])}
        {congruent}
        {linked(a2, a2a, [ctx.getTick(a2a, Obj.EqualAngleTick, options)])}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {linked(a1, ctx.getAngle(a1))}
        {congruent}
        {linked(a2, ctx.getAngle(a2))}
      </span>
    );
  };
}
