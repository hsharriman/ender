import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class Supplementary {
  private static addition = " + ";
  private static equalNinety = " = 180°";
  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    const withGradient =
      props.mode !== SVGModes.Unfocused && props.mode !== SVGModes.Hidden;
    if (withGradient) {
      props.ctx.getAngle(a1)?.addGradient(props.frame);
      props.ctx.getAngle(a2)?.addGradient(props.frame);
    }
    props.ctx.getAngle(a1)?.mode(props.frame, props.mode);
    props.ctx.getAngle(a2)?.mode(props.frame, props.mode);
  };
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
}
