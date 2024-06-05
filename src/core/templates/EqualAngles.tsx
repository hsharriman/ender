import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr, congruent } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class EqualAngles {
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    numTicks = 1,
    a2Mode?: SVGModes
  ) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    const options = props.inPlace
      ? { num: numTicks }
      : { frame: props.frame, num: numTicks };
    props.ctx
      .pushTick(a1a, Obj.EqualAngleTick, options)
      .mode(props.frame, props.mode);
    props.ctx
      .pushTick(a2a, Obj.EqualAngleTick, options)
      .mode(props.frame, a2Mode || props.mode);
  };
  static text = (
    props: StepTextProps,
    [a1, a2]: [string, string],
    num?: number
  ) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    const options = { frame: props.frame, num };
    return (
      <span>
        {linked(a1, a1a, [props.ctx.getTick(a1a, Obj.EqualAngleTick, options)])}
        {congruent}
        {linked(a2, a2a, [props.ctx.getTick(a2a, Obj.EqualAngleTick, options)])}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {linked(a1, ctx.getAngle(a1))}
        {congruent}
        {linked(a2, ctx.getAngle(a2))}
      </span>
    );
  };
  static staticText = (a: [string, string]) => {
    return (
      <span>
        {angleStr(a[0])}
        {congruent}
        {angleStr(a[1])}
      </span>
    );
  };
}
