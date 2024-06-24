import { Content } from "../diagramContent";
import { angleStr } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj } from "../types/types";
import { BaseAngle } from "./BaseAngle";

export class RightAngle {
  private static rightText = " = 90°";
  static additions = (props: StepFocusProps, a: string) => {
    props.ctx
      .getAngle(a)
      .addTick(props.frame, Obj.RightTick)
      .mode(props.frame, props.mode);
  };
  static text = (props: StepTextProps, a: string) => {
    return (
      <span>
        {BaseAngle.text(props, a)}
        {this.rightText}
      </span>
    );
  };
  static ticklessText = (ctx: Content, a: string) => {
    return (
      <span>
        {BaseAngle.ticklessText(ctx, a)}
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
