import { Content } from "../diagramContent";
import { StepFocusProps } from "../types/stepTypes";
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
      return this.staticText([a1, a2]);
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
  static highlight = (
    ctx: Content,
    frame: string,
    [a1, a2]: [string, string],
    mode: SVGModes
  ) => {
    ctx.getAngle(a1).addTick(frame, Obj.RightTick).mode(frame, mode);
    ctx.getAngle(a2).addTick(frame, Obj.RightTick).mode(frame, mode);
  };
}
