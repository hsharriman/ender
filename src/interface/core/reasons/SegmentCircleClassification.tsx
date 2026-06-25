import { circleStr, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class SegmentCircleClassification {
  static text =
    (seg: string, circle: string, type: string) => (isActive: boolean) => {
      return (
        <span>
          {segmentStr(seg, isActive)}
          {" is a "}
          {type}
          {" of "}
          {circleStr(circle)}
        </span>
      );
    };
  static additions = (props: StepFocusProps, seg: string, circle: string) => {
    props.ctx.getSegment(seg)?.mode(props.frame, props.mode);
    props.ctx.getCircle(circle)?.mode(props.frame, props.mode);
  };
}
