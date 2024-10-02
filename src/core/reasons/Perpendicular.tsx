import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { resizedStrs, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";

export class Perpendicular {
  static additions = (
    props: StepFocusProps,
    perp: string,
    segs: [string, string],
    s2Mode?: SVGModes,
    ptMode?: SVGModes
  ) => {
    props.ctx.getSegment(perp).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, ptMode || props.mode);
  };
  static text = (
    ctx: Content,
    label: string,
    segs: [string, string],
    perp: string
  ) => {
    const perp1 = ctx.getSegment(perp);
    const s1 = ctx.getSegment(segs[0]);
    const s2 = ctx.getSegment(segs[1]);
    return (
      <span>
        {linked(perp, perp1)}
        {tooltip(resizedStrs.perpendicular, definitions.Perpendicular)}
        {linked(label, s1, [s2])}
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
