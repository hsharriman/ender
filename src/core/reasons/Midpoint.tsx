import { segmentStr } from "../geometryText";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

// by Definition of midpoint, addition illustrates equal segments, relies on point on line
export class Midpoint {
  static additions = (
    props: StepFocusProps,
    pt: string,
    segs: [string, string],
    num?: number,
    ptMode?: SVGModes
  ) => {
    props.ctx.getPoint(pt).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, props.mode);
    // EqualSegments.additions(props, segs, num);
  };
  static text = (label: string, pt: string) => (isActive: boolean) => {
    return (
      <span>
        {label}
        {" is the midpoint of "}
        {segmentStr(pt, isActive)}
      </span>
    );
  };

  static highlight = (
    props: StepProps,
    pt: string,
    segs: [string, string],
    ptMode: SVGModes,
    mode: SVGModes,
    num?: number
  ) => {
    props.ctx.getPoint(pt).mode(props.frame, ptMode);
    EqualSegments.highlight(props, segs, mode, num);
  };
}
