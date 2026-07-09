import { comma } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";

export class LinearPair {
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
          {comma}
          {BaseAngle.text(a2)(isActive)}
          {" are a linear pair"}
        </span>
      );
    };
}
