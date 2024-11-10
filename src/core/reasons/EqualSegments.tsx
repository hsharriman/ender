import { definitions } from "../../theorems/definitions";
import {
  BGColors,
  chipText,
  makeStepMeta,
  tooltip,
} from "../../theorems/utils";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepMeta, StepUnfocusProps } from "../types/stepTypes";
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
      .mode(props.frame, props.mode2 || props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {chipText(Obj.Segment, s1, BGColors.Blue, isActive)}
          {tooltip(resizedStrs.congruent, definitions.CongruentLines)}
          {chipText(Obj.Segment, s2, BGColors.Purple, isActive)}
        </span>
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
}

export const EqualSegmentStep = (
  s: [string, string],
  reason: Reason,
  step: StepMeta,
  num?: number,
  dependsOn?: number[]
) =>
  makeStepMeta({
    reason,
    dependsOn,
    unfocused: (props: StepUnfocusProps) => {
      step.unfocused(props);
      step.additions({
        ...props,
        mode: SVGModes.Unfocused,
      });
    },
    additions: (props: StepFocusProps) => {
      EqualSegments.additions(props, s, num);
    },
    text: EqualSegments.text(s),
    staticText: () => EqualSegments.staticText(s),
  });
