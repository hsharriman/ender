import { definitions } from "../../theorems/definitions";
import { Reasons } from "../../theorems/reasons";
import { linked, makeStepMeta, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
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
  static text = (ctx: Content, s: string) => {
    const seg = ctx.getSegment(s);
    const MKLinked = linked(s, seg);
    return (
      <span>
        {MKLinked}
        {tooltip(resizedStrs.congruent, definitions.CongruentLines)}
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
    text: (ctx: Content) => Reflexive.text(ctx, seg),
    staticText: () => Reflexive.staticText(seg),
  });
