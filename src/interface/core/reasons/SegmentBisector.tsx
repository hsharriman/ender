import { segmentStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { EqualSegments } from "./EqualSegments";

export class SegmentBisector {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    pt: string,
    numTicks = 1,
  ) => {
    EqualSegments.additions(props, equalSubstrings(s2, pt), numTicks);
    props.ctx.getSegment(s1)?.mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {segmentStr(s1, isActive)}
          {" bisects "}
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
    EqualSegments.highlight(props, equalSubstrings(s2, pt), mode, num);
    props.ctx.getSegment(s1)?.mode(props.frame, mode);
  };
}

const equalSubstrings = (s: string, p: string): [string, string] => [
  `${s[0]}${p}`,
  `${s[1]}${p}`,
];
