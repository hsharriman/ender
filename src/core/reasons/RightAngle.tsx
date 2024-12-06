import { makeStepMeta } from "../../theorems/utils";
import { angleStr } from "../geometryText";
import { StepFocusProps, StepMeta } from "../types/stepTypes";
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
  static text = (a: string) => (isActive: boolean) => {
    return (
      <span>
        {BaseAngle.text(a, "")(isActive)}
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
  step: StepMeta,
  dependsOn?: string[]
) => {
  return makeStepMeta({
    reason,
    dependsOn,
    prevStep: step,
    additions: (props: StepFocusProps) => RightAngle.additions(props, a),
    text: RightAngle.text(a),
    staticText: () => RightAngle.staticText(a),
  });
};
