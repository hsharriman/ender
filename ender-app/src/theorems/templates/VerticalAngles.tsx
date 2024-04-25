import { Content } from "../../core/objgraph";
import { Obj, SVGModes } from "../../core/types";
import { EqualAngles } from "./EqualAngles";

export interface VerticalAnglesProps {
  angs: [string, string];
  segs: [string, string];
}
export class VerticalAngles {
  static additions = (
    ctx: Content,
    frame: string,
    labels: VerticalAnglesProps,
    a1Mode: SVGModes,
    a2Mode: SVGModes,
    sMode: SVGModes,
    inPlace = true,
    numTicks = 1
  ) => {
    const options = inPlace ? { num: numTicks } : { frame, num: numTicks };
    const a1 = ctx.getAngle(labels.angs[0]).mode(frame, a1Mode);
    const a2 = ctx.getAngle(labels.angs[1]).mode(frame, a2Mode);
    ctx.pushTick(a1, Obj.EqualAngleTick, options).mode(frame, a1Mode);
    ctx.pushTick(a2, Obj.EqualAngleTick, options).mode(frame, a2Mode);

    // lines that intersect
    ctx.getSegment(labels.segs[0]).mode(frame, sMode);
    ctx.getSegment(labels.segs[1]).mode(frame, sMode);
    return ctx;
  };

  static text = (
    ctx: Content,
    labels: [string, string],
    options?: { frame?: string; num?: number }
  ) => {
    return EqualAngles.text(ctx, labels, options);
  };
}
