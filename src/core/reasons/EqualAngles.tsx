import { makeStepMeta } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr, resizedStrs } from "../geometryText";
import { StepFocusProps, StepMeta, StepUnfocusProps } from "../types/stepTypes";
import { Obj, Reason, SVGModes } from "../types/types";

export class EqualAngles {
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    numTicks = 1
  ) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    a1a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
    a2a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
  };
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return this.staticText([a1, a2]);
      // return (
      //   <span>
      //     {chipText(Obj.Angle, a1, BGColors.Blue, isActive)}
      //     {resizedStrs.congruent}
      //     {chipText(Obj.Angle, a2, BGColors.Purple, isActive)}
      //   </span>
      // );
    };
  static staticText = (a: [string, string]) => {
    return (
      <span>
        {angleStr(a[0])}
        {resizedStrs.congruent}
        {angleStr(a[1])}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    [a1, a2]: [string, string],
    num: number = 1
  ) => {
    ctx.getAngle(a1).addTick(frame, Obj.EqualAngleTick, num).highlight(frame);
    ctx.getAngle(a2).addTick(frame, Obj.EqualAngleTick, num).highlight(frame);
  };
}

export const EqualAngleStep = (
  [a1, a2]: [string, string],
  reason: Reason,
  step: StepMeta,
  num?: number,
  dependsOn?: string[]
) => {
  return makeStepMeta({
    reason,
    dependsOn,
    unfocused: (props: StepUnfocusProps) => {
      step.unfocused(props);
      step.additions({
        ...props,
        mode: SVGModes.Unfocused,
      });
    },
    additions: (props: StepFocusProps) =>
      EqualAngles.additions(props, [a1, a2], num),
    text: EqualAngles.text([a1, a2]),
    staticText: () => EqualAngles.staticText([a1, a2]),
  });
};
