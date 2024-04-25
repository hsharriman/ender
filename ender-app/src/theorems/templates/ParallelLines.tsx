import { parallel } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { Obj, SVGModes } from "../../core/types";
import { linked } from "../utils";

export class ParallelLines {
  static additions = (
    ctx: Content,
    frame: string,
    [s1, s2]: [string, string],
    s1Mode: SVGModes,
    s2Mode: SVGModes,
    inPlace = true,
    numTicks = 1
  ) => {
    const options = inPlace ? { num: numTicks } : { frame, num: numTicks };
    const s1Seg = ctx.getSegment(s1).mode(frame, s1Mode);
    const s2Seg = ctx.getSegment(s2).mode(frame, s2Mode);
    ctx.pushTick(s1Seg, Obj.ParallelTick, options).mode(frame, s1Mode);
    ctx.pushTick(s2Seg, Obj.ParallelTick, options).mode(frame, s2Mode);
    return ctx;
  };

  static text = (
    ctx: Content,
    [s1, s2]: [string, string],
    options?: { frame?: string; num?: number }
  ) => {
    const s1s = ctx.getSegment(s1);
    const s2s = ctx.getSegment(s2);
    return (
      <span>
        {linked(s1, s1s, [ctx.getTick(s1s, Obj.ParallelTick, options)])}
        {parallel}
        {linked(s2, s2s, [ctx.getTick(s2s, Obj.ParallelTick, options)])}
      </span>
    );
  };

  static ticklessText = (ctx: Content, [s1, s2]: [string, string]) => {
    return (
      <span>
        {linked(s1, ctx.getSegment(s1))}
        {parallel}
        {linked(s2, ctx.getSegment(s2))}
      </span>
    );
  };
}
