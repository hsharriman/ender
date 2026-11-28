import { ProofContent } from "geometry-object";
import { angleStr, segmentStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { BaseAngle } from "./BaseAngle";
import { EqualSegments } from "./EqualSegments";

export class AngleBisector {
  static additions = (props: StepFocusProps, a: string, s: string) => {
    BaseAngle.additions(props, a);
    props.ctx.getSegment(s)?.mode(props.frame, props.mode);
  };
  static text = (a: string, s: string) => (isActive: boolean) => {
    return (
      <span>
        {segmentStr(s, isActive)}
        {" bisects "}
        {angleStr(a)}
      </span>
    );
  };
  static highlight = (
    props: StepProps,
    a: string,
    s: string,
    mode: SVGModes,
    num: number = 1,
  ) => {
    EqualSegments.highlight(props, angleSubstrs(props.ctx, a, s), mode, num);
    props.ctx.getSegment(s)?.mode(props.frame, mode);
  };
}

const angleSubstrs = (
  ctx: ProofContent,
  a: string,
  s: string,
): [string, string] => {
  const ang = ctx.getAngle(a);
  return [`${ang.start.label}${s}`, `${ang.end.label}${s}`];
};
