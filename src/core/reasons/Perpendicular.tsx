import { Content } from "../diagramContent";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class Perpendicular {
  static additions = (
    props: StepFocusProps,
    perp: string,
    segs: [string, string]
  ) => {
    props.ctx.getSegment(perp).mode(props.frame, props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, props.mode);
  };
  static text = (label: string, perp: string) => (isActive: boolean) => {
    return this.staticText(label, perp);
  };
  static staticText = (s1: string, s2: string) => {
    return (
      <span>
        {segmentStr(s1)}
        {resizedStrs.perpendicular}
        {segmentStr(s2)}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    s: string,
    [s1, s2]: [string, string]
  ) => {
    ctx.getSegment(s).highlight(frame);
    ctx.getSegment(s1).highlight(frame);
    ctx.getSegment(s2).highlight(frame);
  };
}
