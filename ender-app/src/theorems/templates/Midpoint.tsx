import { Content } from "../../core/objgraph";
import { Obj, SVGModes } from "../../core/types";
import { StepFocusProps, StepTextProps, linked } from "../utils";
import { EqualSegments } from "./EqualSegments";

export class Midpoint {
  static additions = (
    props: StepFocusProps,
    pt: string,
    segs: [string, string],
    num?: number,
    s2Mode?: SVGModes,
    ptMode?: SVGModes
  ) => {
    props.ctx.getPoint(pt).mode(props.frame, ptMode || props.mode);
    EqualSegments.additions(props, segs, num, s2Mode || props.mode);
  };
  static text = (
    props: StepTextProps,
    label: string,
    segs: [string, string],
    pt: string,
    num?: number
  ) => {
    const s1 = props.ctx.getSegment(segs[0]);
    const s2 = props.ctx.getSegment(segs[1]);
    return (
      <span>
        {linked(pt, props.ctx.getPoint(pt))}
        {" is the midpoint of "}
        {linked(label, s1, [
          s2,
          props.ctx.getTick(s1, Obj.EqualLengthTick, {
            frame: props.frame,
            num,
          }),
          props.ctx.getTick(s2, Obj.EqualLengthTick, {
            frame: props.frame,
            num,
          }),
        ])}
      </span>
    );
  };
  static ticklessText = (
    ctx: Content,
    label: string,
    segs: [string, string],
    pt: string
  ) => {
    return (
      <span>
        {linked(pt, ctx.getPoint("D"))}
        {" is the midpoint of "}
        {linked(label, ctx.getSegment(segs[0]), [ctx.getSegment(segs[1])])}
      </span>
    );
  };
}
