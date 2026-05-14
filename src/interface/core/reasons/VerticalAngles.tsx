import { Obj } from "geometry-object";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
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
    numTicks = 1,
  ) => {
    props.ctx
      .getAngle(labels.angs[0])
      ?.addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getAngle(labels.angs[1])
      ?.addTick(props.frame, Obj.EqualAngleTick, numTicks)
      .mode(props.frame, props.mode);

    // lines that intersect
    props.ctx.getSegment(labels.segs[0])?.mode(props.frame, sMode || props.mode);
    props.ctx.getSegment(labels.segs[1])?.mode(props.frame, sMode || props.mode);
  };

  static text = (labels: [string, string]) => {
    return EqualAngles.text(labels);
  };

  /**
   * ReliesOn styling for the four subsegments from `intersect_seg(seg1, seg2, intersection)`.
   * `seg1` / `seg2` are full segment labels (typically two letters, e.g. `"AB"`, `"CD"`).
   */
  static highlight = (
    props: StepProps,
    seg1: string,
    seg2: string,
    intersection: string,
  ) => {
    const { ctx, frame } = props;
    const ip = intersection;
    if (seg1.length < 2 || seg2.length < 2 || !ip) return;
    const subPair = (full: string): [string, string] => [
      `${full[0]}${ip}`,
      `${full[full.length - 1]}${ip}`,
    ];
    for (const label of [...subPair(seg1), ...subPair(seg2)]) {
      ctx.getSegment(label)?.mode(frame, SVGModes.ReliesOn);
    }
  };
}
