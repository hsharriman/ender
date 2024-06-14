import { linked } from "../../theorems/utils";
import { tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { perpendicular, segmentStr } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { strs } from "../geometryText";
import { definitions } from "../../theorems/definitions";

export class Perpendicular {
  static additions = (
    props: StepFocusProps,
    perp: string,
    segs: [string, string],
    num?: number,
    s2Mode?: SVGModes,
    ptMode?: SVGModes
  ) => {
    props.ctx.getSegment(perp).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[0]).mode(props.frame, ptMode || props.mode);
    props.ctx.getSegment(segs[1]).mode(props.frame, ptMode || props.mode);
  };
  static text = (
    props: StepTextProps,
    label: string,
    segs: [string, string],
    perp: string,
    num?: number
  ) => {
    const perp1 = props.ctx.getSegment(perp);
    const s1 = props.ctx.getSegment(segs[0]);
    const s2 = props.ctx.getSegment(segs[1]);
    return (
      <span>
        {linked(perp, perp1)}
        {tooltip(strs.perpendicular, definitions.Perpendicular)}
        {linked(label, s1, [
          s2,
          props.ctx.getTick(s1, Obj.EqualLengthTick, {
            frame: props.frame,
            num,
          }),
          props.ctx.getTick(s2, Obj.EqualLengthTick, {
            frame: props.frame,
            num,
          }),
        ])}
      </span>
    );
  };
  static ticklessText = (
    ctx: Content,
    label: string,
    segs: [string, string],
    perp: string
  ) => {
    return (
      <span>
        {linked(perp, ctx.getSegment(perp))}
        {tooltip(strs.perpendicular, definitions.Perpendicular)}
        {linked(label, ctx.getSegment(segs[0]), [ctx.getSegment(segs[1])])}
      </span>
    );
  };
  static staticText = (s1: string, s2: string) => {
    return (
      <span>
        {segmentStr(s1)}
        {perpendicular}
        {segmentStr(s2)}
      </span>
    );
  };
}
