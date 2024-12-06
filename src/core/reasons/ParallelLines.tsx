import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class ParallelLines {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1
  ) => {
    props.ctx
      .getSegment(s1)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {segmentStr(s1, isActive)}
          {resizedStrs.parallel}
          {segmentStr(s2, isActive)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [s1, s2]: [string, string],
    mode: SVGModes
  ) => {
    const { ctx, frame } = props;
    ctx.getSegment(s1).addTick(frame, Obj.ParallelTick).mode(frame, mode);
    ctx.getSegment(s2).addTick(frame, Obj.ParallelTick).mode(frame, mode);
  };
}
