import { makeStepMeta } from "../../theorems/utils";
import { angleStr, resizedStrs } from "../geometryText";
import { StepFocusProps, StepMeta, StepProps } from "../types/stepTypes";
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
      return (
        <span>
          {angleStr(a1)}
          {resizedStrs.congruent}
          {angleStr(a2)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [a1, a2]: [string, string],
    mode: SVGModes,
    num: number = 1
  ) => {
    const { ctx, frame } = props;
    ctx.getAngle(a1).addTick(frame, Obj.EqualAngleTick, num).mode(frame, mode);
    ctx.getAngle(a2).addTick(frame, Obj.EqualAngleTick, num).mode(frame, mode);
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
    prevStep: step,
    additions: (props: StepFocusProps) =>
      EqualAngles.additions(props, [a1, a2], num),
    text: EqualAngles.text([a1, a2]),
    staticText: () => EqualAngles.text([a1, a2])(true),
  });
};
