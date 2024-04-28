import { congruent } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { SVGModes, Obj } from "../../core/types";
import { StepFocusProps, StepTextProps, linked } from "../utils";
import { EqualAngles } from "./EqualAngles";
import { RightAngle } from "./RightAngle";

export class EqualRightAngles {
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    a2Mode?: SVGModes
  ) => {
    RightAngle.additions({ ...props }, a1);
    RightAngle.additions({ ...props, mode: a2Mode || props.mode }, a2);
  };
  static text = (props: StepTextProps, [a1, a2]: [string, string]) => {
    const a1s = props.ctx.getAngle(a1);
    const a2s = props.ctx.getAngle(a2);
    return (
      <span>
        {linked(a1, a1s, [
          props.ctx.getTick(a1s, Obj.RightTick, { frame: props.frame }),
        ])}
        {congruent}
        {linked(a2, a2s, [
          props.ctx.getTick(a2s, Obj.RightTick, { frame: props.frame }),
        ])}
      </span>
    );
  };
  static staticText = (a: [string, string]) => {
    return EqualAngles.staticText(a);
  };
}
