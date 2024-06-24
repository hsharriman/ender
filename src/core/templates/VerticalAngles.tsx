import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualAngles } from "./EqualAngles";

export interface VerticalAnglesProps {
  angs: [string, string];
  segs: [string, string];
}
export class VerticalAngles {
  static additions = (
    props: StepFocusProps,
    labels: VerticalAnglesProps,
    a2Mode?: SVGModes,
    sMode?: SVGModes,
    numTicks = 1
  ) => {
    props.ctx
      .getAngle(labels.angs[0])
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getAngle(labels.angs[1])
      .addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, a2Mode || props.mode);

    // lines that intersect
    props.ctx.getSegment(labels.segs[0]).mode(props.frame, sMode || props.mode);
    props.ctx.getSegment(labels.segs[1]).mode(props.frame, sMode || props.mode);
  };

  static text = (
    props: StepTextProps,
    labels: [string, string],
    num?: number
  ) => {
    return EqualAngles.text(props, labels, num);
  };
}
