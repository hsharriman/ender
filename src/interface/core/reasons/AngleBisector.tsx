import { DiagramContent } from "../builder/DiagramContent";
import { angleStr, segmentStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";
import { EqualSegments } from "./EqualSegments";

export class AngleBisector {
  static additions = (
    props: StepFocusProps,
    a: string,
    s: string,
    numTicks = 1,
  ) => {
    // const [sub1, sub2] = angleSubstrs(props.ctx, a, s);
    // EqualAngles.additions(props, [sub1, sub2], numTicks);
    props.ctx
      .getAngle(a)
      ?.mode(props.frame, props.mode)
      .addGradient(props.frame, props.mode);
    // props.ctx.getAngle(sub2)?.addGradient(props.frame);
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
