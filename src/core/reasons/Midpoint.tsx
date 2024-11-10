import { BGColors, chipText } from "../../theorems/utils";
import { segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Midpoint {
  static additions = (
    props: StepFocusProps,
    pt: string,
    segs: [string, string],
    num?: number,
    ptMode?: SVGModes
  ) => {
    props.ctx.getPoint(pt).mode(props.frame, ptMode || props.mode);
    EqualSegments.additions(props, segs, num);
  };
  static text = (label: string, pt: string) => (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Point, pt, BGColors.Blue, isActive)}
        {" is the midpoint of "}
        {chipText(Obj.Point, label, BGColors.Purple, isActive)}
      </span>
    );
  };
  static staticText = (p: string, s: string) => {
    return (
      <span>
        {p}
        {" is the midpoint of "}
        {segmentStr(s)}
      </span>
    );
  };
}
