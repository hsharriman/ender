import { Obj } from "geometry-object";
import { angleStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class BaseAngle {
  static text = (a: string) => (isActive: boolean) => {
    // return chipText(Obj.Angle, a, clr, isActive);
    return angleStr(a);
  };

  static additions = (props: StepFocusProps, a: string) => {
    const a1 = props.ctx.getAngle(a);
    a1.addTick(props.frame, Obj.AngleHighlight).mode(props.frame, props.mode);
  };
}
