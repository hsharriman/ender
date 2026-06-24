import { Obj } from "geometry-object";
import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class RightAngle {
  private static rightText = " = 90°";
  static additions = (props: StepFocusProps, a: string) => {
    props.ctx
      .getAngle(a)
      ?.addTick(props.frame, Obj.RightTick)
      .mode(props.frame, props.mode);
  };
  static text = (a: string) => (isActive: boolean) => {
    return (
      <span>
        {BaseAngle.text(a)(isActive)}
        {this.rightText}
      </span>
    );
  };
}
