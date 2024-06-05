import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { BaseAngle } from "./BaseAngle";
import { RightAngle } from "./RightAngle";

export class EqualRightAngles {
  private static equalNinety = " = 90° = ";
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    a2Mode?: SVGModes
  ) => {
    RightAngle.additions({ ...props }, a1);
    RightAngle.additions({ ...props, mode: a2Mode || props.mode }, a2);
  };
  static text = (props: StepTextProps, [a1, a2]: [string, string]) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    return (
      <span>
        {BaseAngle.text(props, a1, [
          props.ctx.getTick(a1a, Obj.RightTick, { frame: props.frame }),
        ])}
        {this.equalNinety}
        {BaseAngle.text(props, a2, [
          props.ctx.getTick(a2a, Obj.RightTick, { frame: props.frame }),
        ])}
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
