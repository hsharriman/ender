import { StepFocusProps, StepProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { BaseAngle } from "./BaseAngle";
import { RightAngle } from "./RightAngle";

export class EqualRightAngles {
  private static equalNinety = " = 90° = ";
  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    RightAngle.additions({ ...props }, a1);
    RightAngle.additions({ ...props, mode: props.mode }, a2);
  };
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {BaseAngle.text(a1)(isActive)}
          {this.equalNinety}
          {BaseAngle.text(a2)(isActive)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [a1, a2]: [string, string],
    mode: SVGModes
  ) => {
    const { ctx, frame } = props;
    ctx.getAngle(a1).addTick(frame, Obj.RightTick).mode(frame, mode);
    ctx.getAngle(a2).addTick(frame, Obj.RightTick).mode(frame, mode);
  };
}
