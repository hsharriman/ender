import { definitions } from "../../theorems/definitions";
import { Reasons } from "../../theorems/reasons";
import {
  BGColors,
  chipText,
  makeStepMeta,
  tooltip,
} from "../../theorems/utils";
import { resizedStrs } from "../geometryText";
import { StepFocusProps, StepMeta, StepUnfocusProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Reflexive {
  static additions = (props: StepFocusProps, s: string, num = 1) => {
    props.ctx
      .getSegment(s)
      .addTick(props.frame, Obj.EqualLengthTick, num)
      .mode(props.frame, props.mode);
  };
  static text = (s: string) => (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Segment, s, BGColors.Blue, isActive)}
        {tooltip(resizedStrs.congruent, definitions.CongruentLines)}
        {chipText(Obj.Segment, s, BGColors.Blue, isActive)}
      </span>
    );
  };
  static staticText = (s: string) => {
    return EqualSegments.staticText([s, s]);
  };
}

export const ReflexiveStep = (seg: string, num: number, step: StepMeta) =>
  makeStepMeta({
    reason: Reasons.Reflexive,
    unfocused: (props: StepUnfocusProps) => {
      step.unfocused(props);
      step.additions({
        ...props,
        mode: SVGModes.Unfocused,
      });
    },
    additions: (props: StepFocusProps) => {
      Reflexive.additions(props, seg, num);
    },
    text: Reflexive.text(seg),
    staticText: () => Reflexive.staticText(seg),
  });
