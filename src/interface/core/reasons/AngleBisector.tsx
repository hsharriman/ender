import { DiagramContent } from "../builder/DiagramContent";
import { angleStr, segmentStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { EqualAngles } from "./EqualAngles";
import { EqualSegments } from "./EqualSegments";

export class AngleBisector {
  static additions = (
    props: StepFocusProps,
    a: string,
    s: string,
    numTicks = 1,
  ) => {
    EqualAngles.additions(props, angleSubstrs(props.ctx, a, s), numTicks);
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
  ctx: DiagramContent,
  a: string,
  s: string,
): [string, string] => {
  const ang = ctx.getAngle(a);
  return [`${ang.obj.start}${s}`, `${ang.obj.end}${s}`];
};
