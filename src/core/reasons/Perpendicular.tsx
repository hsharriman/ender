import { definitions } from "../../theorems/definitions";
import { BGColors, chipText, tooltip } from "../../theorems/utils";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class Perpendicular {
  static additions = (
    props: StepFocusProps,
    perp: string,
    segs: [string, string],
    ptMode?: SVGModes
  ) => {
    props.ctx.getSegment(perp).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, ptMode || props.mode);
  };
  static text = (label: string, perp: string) => (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Segment, perp, BGColors.Blue, isActive)}
        {tooltip(resizedStrs.perpendicular, definitions.Perpendicular)}
        {chipText(Obj.Segment, label, BGColors.Purple, isActive)}
      </span>
    );
  };
  static staticText = (s1: string, s2: string) => {
    return (
      <span>
        {segmentStr(s1)}
        {resizedStrs.perpendicular}
        {segmentStr(s2)}
      </span>
    );
  };
}
