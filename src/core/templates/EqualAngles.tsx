import { definitions } from "../../theorems/definitions";
import { makeStepMeta, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr, resizedStrs } from "../geometryText";
import { StepFocusProps, StepMeta, StepUnfocusProps } from "../types/stepTypes";
import { Obj, Reason, SVGModes } from "../types/types";
import { BaseAngle } from "./BaseAngle";

export class EqualAngles {
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    numTicks = 1,
    a2Mode?: SVGModes
  ) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    a1a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
    a2a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, a2Mode || props.mode);
  };
  static text = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {BaseAngle.text(ctx, a1)}
        {tooltip(resizedStrs.congruent, definitions.CongruentAngles)}
        {BaseAngle.text(ctx, a2)}
      </span>
    );
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
}

export const EqualAngleStep = (
  [a1, a2]: [string, string],
  reason: Reason,
  step: StepMeta,
  num?: number,
  dependsOn?: number[]
) => {
  return makeStepMeta({
    reason,
    dependsOn,
    unfocused: (props: StepUnfocusProps) => {
      step.unfocused(props);
      step.additions({ ...props, mode: SVGModes.Unfocused });
    },
    additions: (props: StepFocusProps) =>
      EqualAngles.additions(props, [a1, a2], num),
    text: (ctx: Content) => EqualAngles.text(ctx, [a1, a2]),
    staticText: () => EqualAngles.staticText([a1, a2]),
  });
};
