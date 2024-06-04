import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { congruent, segmentStr } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class EqualSegments {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1,
    s2Mode?: SVGModes
  ) => {
    const options = props.inPlace
      ? { num: numTicks }
      : { frame: props.frame, num: numTicks };
    const s1Seg = props.ctx.getSegment(s1).mode(props.frame, props.mode);
    const s2Seg = props.ctx
      .getSegment(s2)
      .mode(props.frame, s2Mode || props.mode);
    props.ctx
      .pushTick(s1Seg, Obj.EqualLengthTick, options)
      .mode(props.frame, props.mode);
    props.ctx
      .pushTick(s2Seg, Obj.EqualLengthTick, options)
      .mode(props.frame, s2Mode || props.mode);
  };
  static text = (
    props: StepTextProps,
    [s1, s2]: [string, string],
    num?: number
  ) => {
    const s1s = props.ctx.getSegment(s1);
    const s2s = props.ctx.getSegment(s2);
    const options = { frame: props.frame, num };
    return (
      <span>
        {linked(s1, s1s, [
          props.ctx.getTick(s1s, Obj.EqualLengthTick, options),
        ])}
        {congruent}
        {linked(s2, s2s, [
          props.ctx.getTick(s2s, Obj.EqualLengthTick, options),
        ])}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [s1, s2]: [string, string]) => {
    return (
      <span>
        {linked(s1, ctx.getSegment(s1))}
        {congruent}
        {linked(s2, ctx.getSegment(s2))}
      </span>
    );
  };
  static staticText = (s: [string, string]) => {
    return (
      <span>
        {segmentStr(s[0])}
        {congruent}
        {segmentStr(s[1])}
      </span>
    );
  };
}
