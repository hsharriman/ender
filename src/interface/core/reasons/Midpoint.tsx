import { segmentStr } from "../geometryText";
import { ShowPoint, SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { EqualSegments } from "./EqualSegments";

// by Definition of midpoint, addition illustrates equal segments, relies on point on line
export class Midpoint {
  static additions = (
    props: StepFocusProps,
    pt: string,
    seg: string,
    ptMode?: SVGModes,
  ) => {
    props.ctx
      .getPoint(pt)
      ?.setShowPoint(ShowPoint.Adaptive)
      .mode(props.frame, ptMode || props.mode);
    const [s1, s2] = midpointSubsegments(seg, pt);
    props.ctx.getSegment(s1)?.mode(props.frame, props.mode);
    props.ctx.getSegment(s2)?.mode(props.frame, props.mode);
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
    num?: number,
  ) => {
    props.ctx.getPoint(pt)?.mode(props.frame, ptMode);
    EqualSegments.highlight(props, segs, mode, num);
  };
}

const midpointSubsegments = (
  segment: string,
  midpoint: string,
): [string, string] => {
  const a = segment[0];
  const b = segment[segment.length - 1];
  return [`${a}${midpoint}`, `${midpoint}${b}`];
};
