import { segmentStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { SegmentBisector } from "./SegmentBisector";

export class PerpBisector {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    pt: string,
    numTicks = 1,
  ) => {
    SegmentBisector.additions(props, [s1, s2], pt, numTicks);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {segmentStr(s1, isActive)}
          {" is the perpendicular bisector of "}
          {segmentStr(s2, isActive)}
        </span>
      );
    };
  static highlight = (
    props: StepProps,
    [s1, s2]: [string, string],
    pt: string,
    mode: SVGModes,
    num: number = 1,
  ) => {
    SegmentBisector.highlight(props, [s1, s2], pt, mode, num);
  };
}
