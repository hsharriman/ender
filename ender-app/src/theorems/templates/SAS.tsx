import { congruent } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { Obj, SVGModes } from "../../core/types";
import { linked } from "../utils";
import { EqualAngles } from "./EqualAngles";
import { EqualSegments } from "./EqualSegments";

interface SASProps {
  seg1s: [string, string];
  seg2s: [string, string];
  angles: [string, string];
  triangles: [string, string];
}
export class SAS {
  static text = (ctx: Content, labels: SASProps, frame?: string) => {
    const [t1s1, t2s1] = labels.seg1s;
    const [t1s2, t2s2] = labels.seg2s;
    const [t1a, t2a] = labels.angles;
    const [t1, t2] = labels.triangles;

    return (
      <span>
        {linked(t1, ctx.getTriangle(t1), [
          ctx.getTick(ctx.getSegment(t1s1), Obj.EqualLengthTick, {
            frame,
          }),
          ctx.getTick(ctx.getSegment(t1s2), Obj.EqualLengthTick, {
            num: 2,
            frame,
          }),
          ctx.getTick(ctx.getAngle(t1a), Obj.EqualAngleTick, {
            frame,
          }),
        ])}
        {congruent}
        {linked(t2, ctx.getTriangle(t2), [
          ctx.getTick(ctx.getSegment(t2s1), Obj.EqualLengthTick, {
            frame,
          }),
          ctx.getTick(ctx.getSegment(t2s2), Obj.EqualLengthTick, {
            num: 2,
            frame,
          }),
          ctx.getTick(ctx.getAngle(t2a), Obj.EqualAngleTick, {
            frame,
          }),
        ])}
      </span>
    );
  };

  static additions = (
    ctx: Content,
    labels: SASProps,
    frame: string,
    t1Mode: SVGModes,
    t2Mode: SVGModes,
    inPlace = true
  ) => {
    ctx.getTriangle(labels.triangles[0]).mode(frame, t1Mode);
    ctx.getTriangle(labels.triangles[1]).mode(frame, t2Mode);
    EqualSegments.additions(ctx, labels.seg1s, frame, t1Mode, t2Mode, inPlace);
    EqualSegments.additions(
      ctx,
      labels.seg2s,
      frame,
      t1Mode,
      t2Mode,
      inPlace,
      2
    );
    EqualAngles.additions(ctx, labels.angles, frame, t1Mode, t2Mode, inPlace);
    return ctx;
  };
}
