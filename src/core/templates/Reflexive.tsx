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
    const options = props.inPlace ? { num } : { frame: props.frame, num };
    const seg = props.ctx.getSegment(s).mode(props.frame, props.mode);
    props.ctx
      .pushTick(seg, Obj.EqualLengthTick, options)
      .mode(props.frame, props.mode);
  };
  static text = (props: StepTextProps, s: string, num = 1) => {
    const seg = props.ctx.getSegment(s);
    const MKLinked = linked(s, seg, [
      props.ctx.getTick(seg, Obj.EqualLengthTick, { frame: props.frame, num }),
    ]);
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
