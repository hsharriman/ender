import { definitions } from "../../theorems/definitions";
import { tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { angleStr, congruent, resizedStrs } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { BaseAngle } from "./BaseAngle";

export class EqualAngles {
  static additions = (
    props: StepFocusProps,
    [a1, a2]: [string, string],
    numTicks = 1,
    a2Mode?: SVGModes
  ) => {
    const a1a = props.ctx.getAngle(a1);
    const a2a = props.ctx.getAngle(a2);
    a1a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
    a2a
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
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
        {BaseAngle.text(props, a1)}
        {tooltip(resizedStrs.congruent, definitions.CongruentAngles)}
        {BaseAngle.text(props, a2)}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [a1, a2]: [string, string]) => {
    return (
      <span>
        {BaseAngle.ticklessText(ctx, a1)}
        {tooltip(resizedStrs.congruent, definitions.CongruentAngles)}
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
