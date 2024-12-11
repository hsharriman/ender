import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";

export class Perpendicular {
  static additions = (
    props: StepFocusProps,
    perp: string,
    segs: [string, string]
  ) => {
    props.ctx.getSegment(perp).mode(props.frame, props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, props.mode);
  };
  static text = (label: string, perp: string) => (isActive: boolean) => {
    return (
      <span>
        {segmentStr(label, isActive)}
        {resizedStrs.perpendicular}
        {segmentStr(perp, isActive)}
      </span>
    );
  };
  static highlight = (
    props: StepProps,
    s: string,
    [s1, s2]: [string, string],
    mode: SVGModes
  ) => {
    const { ctx, frame } = props;
    ctx.getSegment(s).mode(frame, mode);
    ctx.getSegment(s1).mode(frame, mode);
    ctx.getSegment(s2).mode(frame, mode);
  };
}
