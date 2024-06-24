import { Content } from "../diagramContent";
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
    return (
      <span>
        {BaseAngle.text(props, a1)}
        {this.equalNinety}
        {BaseAngle.text(props, a2)}
      </span>
    );
  };
  static ticklesstText = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {BaseAngle.ticklessText(ctx, a1)}
        {this.equalNinety}
        {BaseAngle.ticklessText(ctx, a2)}
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
