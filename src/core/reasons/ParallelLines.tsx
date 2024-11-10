import { definitions } from "../../theorems/definitions";
import { BGColors, chipText, tooltip } from "../../theorems/utils";
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
      .mode(props.frame, props.mode2 || props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {chipText(Obj.Segment, s1, BGColors.Blue, isActive)}
          {tooltip(resizedStrs.parallel, definitions.Parallel)}
          {chipText(Obj.Segment, s2, BGColors.Purple, isActive)}
        </span>
      );
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
}
