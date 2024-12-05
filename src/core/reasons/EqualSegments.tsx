import { makeStepMeta } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepMeta } from "../types/stepTypes";
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
        // <span>
        //   {chipText(Obj.Segment, s1, BGColors.Blue, isActive)}
        //   {resizedStrs.congruent}
        //   {chipText(Obj.Segment, s2, BGColors.Purple, isActive)}
        // </span>
        this.staticText([s1, s2])
      );
    };
  static staticText = (s: [string, string]) => {
    return (
      <span>
        {segmentStr(s[0])}
        {resizedStrs.congruent}
        {segmentStr(s[1])}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    [s1, s2]: [string, string],
    mode: SVGModes,
    num: number = 1
  ) => {
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
    staticText: () => EqualSegments.staticText(s),
  });
