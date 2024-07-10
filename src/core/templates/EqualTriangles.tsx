import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { resizedStrs, triangleStr } from "../geometryText";
import { StepFocusProps, StepUnfocusProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";

export class EqualTriangles {
  static text = (
    ctx: Content,
    [t1, t2]: [string, string],
    t1clr?: string,
    t2clr?: string
  ) => {
    const t1s = ctx.getTriangle(t1);
    const t2s = ctx.getTriangle(t2);
    return (
      <span>
        {linked(t1, t1s, undefined, t1clr)}
        {tooltip(resizedStrs.congruent, definitions.CongruentTriangles)}
        {linked(t2, t2s, undefined, t2clr)}
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
    props.ctx.getTriangle(t2).mode(props.frame, props.mode);
  };

  static unfocused = (props: StepUnfocusProps, [t1, t2]: [string, string]) => {
    props.ctx.getTriangle(t1).mode(props.frame, SVGModes.UnfocusedTriangle);
    props.ctx.getTriangle(t2).mode(props.frame, SVGModes.UnfocusedTriangle);
  };
}
