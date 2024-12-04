import { Content } from "../diagramContent";
import { segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
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
    return this.staticText(label, pt);
  };
  static staticText = (p: string, s: string) => {
    return (
      <span>
        {p}
        {" is the midpoint of "}
        {segmentStr(s)}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    pt: string,
    segs: [string, string],
    ptMode: SVGModes,
    mode: SVGModes,
    num?: number
  ) => {
    ctx.getPoint(pt).mode(frame, ptMode);
    EqualSegments.highlight(ctx, frame, segs, mode, num);
  };
}

// by Definition of converse midpoint, addition illustrates point, highlights equal segments
export class ConvMidpoint {
  static additions = (
    props: StepFocusProps,
    pt: string,
    segs: [string, string],
    num?: number,
    ptMode?: SVGModes
  ) => {
    props.ctx.getPoint(pt).mode(props.frame, ptMode || props.mode);
    EqualSegments.additions(props, segs, num);
  };
  static text = (label: string, pt: string) => (isActive: boolean) => {
    return this.staticText(label, pt);
  };
  static staticText = (p: string, s: string) => {
    return (
      <span>
        {p}
        {" is the midpoint of "}
        {segmentStr(s)}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    pt: string,
    segs: [string, string],
    ptMode: SVGModes,
    mode: SVGModes,
    num?: number
  ) => {
    ctx.getPoint(pt).mode(frame, ptMode);
    EqualSegments.highlight(ctx, frame, segs, mode, num);
  };
}
