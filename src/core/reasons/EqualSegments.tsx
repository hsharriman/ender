import { makeStepMeta } from "../../theorems/utils";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepMeta, StepProps } from "../types/stepTypes";
import { Obj, Reason, SVGModes } from "../types/types";

export class EqualSegments {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1
  ) => {
    props.ctx
      .getSegment(s1)
      .addTick(props.frame, Obj.EqualLengthTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      .addTick(props.frame, Obj.EqualLengthTick, numTicks)
      .mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {segmentStr(s1, isActive)}
          {resizedStrs.congruent}
          {segmentStr(s2, isActive)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [s1, s2]: [string, string],
    mode: SVGModes,
    num: number = 1
  ) => {
    const { ctx, frame } = props;
    ctx
      .getSegment(s1)
      .addTick(frame, Obj.EqualLengthTick, num)
      .mode(frame, mode);
    ctx
      .getSegment(s2)
      .addTick(frame, Obj.EqualLengthTick, num)
      .mode(frame, mode);
  };
}

export const EqualSegmentStep = (
  s: [string, string],
  reason: Reason,
  step: StepMeta,
  num?: number,
  dependsOn?: string[]
) =>
  makeStepMeta({
    reason,
    dependsOn,
    prevStep: step,
    additions: (props: StepFocusProps) => {
      EqualSegments.additions(props, s, num);
    },
    text: EqualSegments.text(s),
    staticText: () => EqualSegments.text(s)(true),
  });
