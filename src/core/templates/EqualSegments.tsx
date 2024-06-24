import { definitions } from "../../theorems/definitions";
import { linked, makeStepMeta, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { congruent, segmentStr, strs } from "../geometryText";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../types/stepTypes";
import { Obj, Reason, SVGModes } from "../types/types";

export class EqualSegments {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1,
    s2Mode?: SVGModes
  ) => {
    props.ctx
      .getSegment(s1)
      .addTick(props.frame, Obj.EqualLengthTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      .addTick(props.frame, Obj.EqualLengthTick, numTicks)
      .mode(props.frame, s2Mode || props.mode);
  };
  static text = (
    props: StepTextProps,
    [s1, s2]: [string, string],
    num?: number
  ) => {
    const s1s = props.ctx.getSegment(s1);
    const s2s = props.ctx.getSegment(s2);
    return (
      <span>
        {linked(s1, s1s)}
        {tooltip(strs.congruent, definitions.CongruentLines)}
        {linked(s2, s2s)}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [s1, s2]: [string, string]) => {
    return (
      <span>
        {linked(s1, ctx.getSegment(s1))}
        {tooltip(strs.congruent, definitions.CongruentLines)}
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
      step.additions({ ...props, mode: SVGModes.Unfocused });
    },
    additions: (props: StepFocusProps) => {
      EqualSegments.additions(props, s, num);
    },
    text: (props: StepTextProps) => {
      return EqualSegments.text(props, s, num);
    },
    staticText: () => EqualSegments.staticText(s),
  });
