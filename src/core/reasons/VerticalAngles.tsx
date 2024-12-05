import { Content } from "../diagramContent";
import { StepFocusProps } from "../types/stepTypes";
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
      .mode(props.frame, props.mode);

    // lines that intersect
    props.ctx.getSegment(labels.segs[0]).mode(props.frame, sMode || props.mode);
    props.ctx.getSegment(labels.segs[1]).mode(props.frame, sMode || props.mode);
  };

  static text = (labels: [string, string]) => {
    return EqualAngles.text(labels);
  };
  static highlight = (
    ctx: Content,
    frame: string,
    labels: VerticalAnglesProps,
    s2s?: [string, string]
  ) => {
    ctx.getSegment(labels.segs[0]).mode(frame, SVGModes.ReliesOn);
    ctx.getSegment(labels.segs[1]).mode(frame, SVGModes.ReliesOn);
    if (s2s) {
      ctx.getSegment(s2s[0]).mode(frame, SVGModes.ReliesOn);
      ctx.getSegment(s2s[1]).mode(frame, SVGModes.ReliesOn);
    }
  };
}
