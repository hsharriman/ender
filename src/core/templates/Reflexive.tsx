import { definitions } from "../../theorems/definitions";
import { Reasons } from "../../theorems/reasons";
import { linked, makeStepMeta, tooltip } from "../../theorems/utils";
import { strs } from "../geometryText";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Reflexive {
  static additions = (props: StepFocusProps, s: string, num = 1) => {
    props.ctx
      .getSegment(s)
      .addTick(props.frame, Obj.EqualLengthTick, num)
      .mode(props.frame, props.mode);
  };
  static text = (props: StepTextProps, s: string, num = 1) => {
    const seg = props.ctx.getSegment(s);
    const MKLinked = linked(s, seg);
    return (
      <span>
        {MKLinked}
        {tooltip(strs.congruent, definitions.CongruentLines)}
        {MKLinked}
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
      step.additions({ ...props, mode: SVGModes.Unfocused });
    },
    additions: (props: StepFocusProps) => {
      Reflexive.additions(props, seg, num);
    },
    text: (props: StepTextProps) => Reflexive.text(props, seg, num),
    staticText: () => Reflexive.staticText(seg),
  });
