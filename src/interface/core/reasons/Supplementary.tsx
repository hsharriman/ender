import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class Supplementary {
  private static addition = " + ";
  private static equalNinety = " = 180°";
  static text =
    ([a1, a2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {BaseAngle.text(a1)(isActive)}
          {this.addition}
          {BaseAngle.text(a2)(isActive)}
          {this.equalNinety}
        </span>
      );
    };

  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    BaseAngle.additions(props, a1);
    BaseAngle.additions(props, a2);
  };
  // static highlight = (
  //   props: StepProps,
  //   [a1, a2]: [string, string],
  //   mode: SVGModes,
  // ) => {
  //   const { ctx, frame } = props;
  //   ctx.getAngle(a1)?.addTick(frame, Obj.RightTick).mode(frame, mode);
  //   ctx.getAngle(a2)?.addTick(frame, Obj.RightTick).mode(frame, mode);
  // };
}
