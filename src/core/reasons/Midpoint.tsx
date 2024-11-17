import { Content } from "../diagramContent";
import { segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Midpoint {
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
    num?: number
  ) => {
    ctx.getPoint(pt).highlight(frame);
    EqualSegments.highlight(ctx, frame, segs, num);
  };
}
