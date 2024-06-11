import { Content } from "../diagramContent";
import { tooltip } from "../../theorems/utils";
import { angleStr, congruent } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { BaseAngle } from "./BaseAngle";
import { strs } from "../geometryText";
import { definitions } from "../../theorems/definitions";

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
    const options = { frame: props.frame, num };
    return (
      <span>
        {BaseAngle.text(props, a1, [
          props.ctx.getTick(
            props.ctx.getAngle(a1),
            Obj.EqualAngleTick,
            options
          ),
        ])}
        {tooltip(strs.congruent, definitions.CongruentAngles)}
        {BaseAngle.text(props, a2, [
          props.ctx.getTick(
            props.ctx.getAngle(a2),
            Obj.EqualAngleTick,
            options
          ),
        ])}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {BaseAngle.ticklessText(ctx, a1)}
        {tooltip(strs.congruent, definitions.CongruentAngles)}
        {BaseAngle.ticklessText(ctx, a2)}
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
