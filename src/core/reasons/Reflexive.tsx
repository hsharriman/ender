import { Reasons } from "../../theorems/reasons";
import { makeStepMeta } from "../../theorems/utils";
import { Content } from "../diagramContent";
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
    return this.staticText(s);
  };
  static staticText = (s: string) => {
    return EqualSegments.staticText([s, s]);
  };
  static highlight = (ctx: Content, frame: string, s: string, num = 1) => {
    return EqualSegments.highlight(ctx, frame, [s, s], num);
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
    highlight: (ctx: Content, frame: string) => {
      Reflexive.highlight(ctx, frame, seg, num);
    },
  });
