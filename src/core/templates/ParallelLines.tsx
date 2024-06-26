import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { parallel, resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class ParallelLines {
  static additions = (
    props: StepFocusProps,
    [s1, s2]: [string, string],
    numTicks = 1,
    s2Mode?: SVGModes
  ) => {
    props.ctx
      .getSegment(s1)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, props.mode);
    props.ctx
      .getSegment(s2)
      .addTick(props.frame, Obj.ParallelTick, numTicks)
      .mode(props.frame, s2Mode || props.mode);
  };

  static text = (
    props: StepTextProps,
    [s1, s2]: [string, string],
    num?: number
  ) => {
    const s1s = props.ctx.getSegment(s1);
    const s2s = props.ctx.getSegment(s2);
    const options = { frame: props.frame, num };
    return (
      <span>
        {linked(s1, s1s)}
        {tooltip(resizedStrs.parallel, definitions.Parallel)}
        {linked(s2, s2s)}
      </span>
    );
  };

  static ticklessText = (ctx: Content, [s1, s2]: [string, string]) => {
    return (
      <span>
        {linked(s1, ctx.getSegment(s1))}
        {tooltip(resizedStrs.parallel, definitions.Parallel)}
        {linked(s2, ctx.getSegment(s2))}
      </span>
    );
  };
  static staticText = (s: [string, string]) => {
    return (
      <span>
        {segmentStr(s[0])}
        {parallel}
        {segmentStr(s[1])}
      </span>
    );
  };
}
