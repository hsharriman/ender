import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj } from "../types/types";

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
  static staticText = (a: string) => {
    return (
      <span>
        {angleStr(a)}
        {this.rightText}
      </span>
    );
  };
}
