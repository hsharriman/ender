import { circleStr, segmentStr } from "../geometryText";
import { ShowPoint, SVGModes } from "../types/diagramTypes";
import { StepFocusProps } from "../types/stepTypes";

export class Tangent {
  static additions = (
    props: StepFocusProps,
    pt: string,
    seg: string,
    c: string,
    ptMode?: SVGModes,
  ) => {
    props.ctx
      .getPoint(pt)
      ?.setShowPoint(ShowPoint.Adaptive)
      .mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(seg)?.mode(props.frame, props.mode);
    props.ctx.getCircle(c)?.mode(props.frame, props.mode);
  };
  static text = (s: string, c: string, pt: string) => (isActive: boolean) => {
    return (
      <span>
        {segmentStr(s, isActive)}
        {" is the tangent to "}
        {circleStr(c)}
        {` at ${pt}`}
      </span>
    );
  };
}
