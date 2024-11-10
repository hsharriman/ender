import { BGColors, chipText } from "../../theorems/utils";
import { StepFocusProps } from "../types/stepTypes";
import { Obj } from "../types/types";
import { BaseAngle } from "./BaseAngle";
import { RightAngle } from "./RightAngle";

export class EqualRightAngles {
  private static equalNinety = " = 90° = ";
  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    RightAngle.additions({ ...props }, a1);
    RightAngle.additions({ ...props, mode: props.mode2 || props.mode }, a2);
  };
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {chipText(Obj.Angle, a1, BGColors.Blue, isActive)}
          {this.equalNinety}
          {chipText(Obj.Angle, a2, BGColors.Purple, isActive)}
        </span>
      );
    };
  static staticText = (a: [string, string]) => {
    return (
      <span>
        {BaseAngle.staticText(a[0])}
        {this.equalNinety}
        {BaseAngle.staticText(a[1])}
      </span>
    );
  };
}
