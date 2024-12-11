import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Reflexive {
  static additions = (props: StepFocusProps, s: string, num = 1) => {
    props.ctx
      .getSegment(s)
      .addTick(props.frame, Obj.EqualLengthTick, num)
      .mode(props.frame, props.mode);
  };
  static text = (s: string) => (isActive: boolean) => {
    return (
      <span>
        {segmentStr(s, isActive)}
        {resizedStrs.congruent}
        {segmentStr(s, isActive)}
      </span>
    );
  };
  static highlight = (props: StepProps, s: string, mode: SVGModes, num = 1) => {
    return EqualSegments.highlight(props, [s, s], mode, num);
  };
}
