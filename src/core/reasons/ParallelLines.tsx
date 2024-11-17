import { Content } from "../diagramContent";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { Obj } from "../types/types";

export class ParallelLines {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1
  ) => {
    props.ctx
      .getSegment(s1)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return this.staticText([s1, s2]);
    };

  static staticText = (s: [string, string]) => {
    return (
      <span>
        {segmentStr(s[0])}
        {resizedStrs.parallel}
        {segmentStr(s[1])}
      </span>
    );
  };
  static highlight = (
    ctx: Content,
    frame: string,
    [s1, s2]: [string, string]
  ) => {
    ctx.getSegment(s1).addTick(frame, Obj.ParallelTick).highlight(frame);
    ctx.getSegment(s2).addTick(frame, Obj.ParallelTick).highlight(frame);
  };
}
