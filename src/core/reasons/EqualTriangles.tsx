import { definitions } from "../../theorems/definitions";
import { BGColors, chipText, tooltip } from "../../theorems/utils";
import { resizedStrs, triangleStr } from "../geometryText";
import { StepFocusProps, StepUnfocusProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";

export class EqualTriangles {
  static text =
    ([t1, t2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {chipText(Obj.Triangle, t1, BGColors.Blue, isActive)}
          {tooltip(resizedStrs.congruent, definitions.CongruentTriangles)}
          {chipText(Obj.Triangle, t2, BGColors.Purple, isActive)}
        </span>
      );
    };
  static staticText = (t: [string, string]) => {
    return (
      <span>
        {triangleStr(t[0])}
        {resizedStrs.congruent}
        {triangleStr(t[1])}
      </span>
    );
  };
  static additions = (props: StepFocusProps, [t1, t2]: [string, string]) => {
    props.ctx.getTriangle(t1).mode(props.frame, props.mode);
    props.ctx.getTriangle(t2).mode(props.frame, props.mode2 || props.mode);
  };

  static unfocused = (props: StepUnfocusProps, [t1, t2]: [string, string]) => {
    props.ctx.getTriangle(t1).mode(props.frame, SVGModes.UnfocusedTriangle);
    props.ctx.getTriangle(t2).mode(props.frame, SVGModes.UnfocusedTriangle);
  };
}
