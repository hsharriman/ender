import { congruent } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { SVGModes, Obj } from "../../core/types";
import { StepFocusProps, StepTextProps, linked } from "../utils";

export class RightAngle {
  private static rightText = " = 90°";
  static additions = (props: StepFocusProps, a: string) => {
    const ang = props.ctx.getAngle(a);
    const options = props.inPlace ? {} : { frame: props.frame };
    props.ctx
      .pushTick(ang, Obj.RightTick, options)
      .mode(props.frame, props.mode);
  };
  static text = (props: StepTextProps, a: string) => {
    const ang = props.ctx.getAngle(a);
    return (
      <span>
        {linked(a, ang, [
          props.ctx.getTick(ang, Obj.RightTick, { frame: props.frame }),
        ])}
        {this.rightText}
      </span>
    );
  };
  static ticklessText = (ctx: Content, a: string) => {
    return (
      <span>
        {linked(a, ctx.getAngle(a))}
        {this.rightText}
      </span>
    );
  };
}
