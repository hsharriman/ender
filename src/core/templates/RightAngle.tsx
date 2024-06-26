import { makeStepMeta } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr } from "../geometryText";
import { StepFocusProps, StepUnfocusProps } from "../types/stepTypes";
import { Obj, Reason } from "../types/types";
import { BaseAngle } from "./BaseAngle";

export class RightAngle {
  private static rightText = " = 90°";
  static additions = (props: StepFocusProps, a: string) => {
    props.ctx
      .getAngle(a)
      .addTick(props.frame, Obj.RightTick)
      .mode(props.frame, props.mode);
  };
  static text = (ctx: Content, a: string) => {
    return (
      <span>
        {BaseAngle.text(ctx, a)}
        {this.rightText}
      </span>
    );
  };
  static staticText = (a: string) => {
    return (
      <span>
        {angleStr(a)}
        {this.rightText}
      </span>
    );
  };
}

export const RightAngleStep = (
  a: string,
  reason: Reason,
  dependsOn?: number[],
  unfocused?: (props: StepUnfocusProps) => void
) => {
  return makeStepMeta({
    reason,
    dependsOn,
    unfocused,
    additions: (props: StepFocusProps) => RightAngle.additions(props, a),
    text: (ctx: Content) => RightAngle.text(ctx, a),
    staticText: () => RightAngle.staticText(a),
  });
};
