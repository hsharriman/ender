import { Obj } from "geometry-object";
import { segmentStr, strs } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";

export class SimilarSegments {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1,
  ) => {
    props.ctx
      .getSegment(s1)
      ?.addTick(props.frame, Obj.SimilarTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      ?.addTick(props.frame, Obj.SimilarTick, numTicks)
      .mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {segmentStr(s1, isActive)}
          {strs.similar}
          {segmentStr(s2, isActive)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [s1, s2]: [string, string],
    mode: SVGModes,
    num: number = 1,
  ) => {
    const { ctx, frame } = props;
    ctx.getSegment(s1)?.addTick(frame, Obj.SimilarTick, num).mode(frame, mode);
    ctx.getSegment(s2)?.addTick(frame, Obj.SimilarTick, num).mode(frame, mode);
  };
}
