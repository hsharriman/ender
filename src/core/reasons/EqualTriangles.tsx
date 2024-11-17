import { Content } from "../diagramContent";
import { resizedStrs, triangleStr } from "../geometryText";
import { StepFocusProps, StepUnfocusProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";

export class EqualTriangles {
  static text =
    ([t1, t2]: [string, string]) =>
    (isActive: boolean) => {
      return this.staticText([t1, t2]);
      // <span>
      //   {chipText(Obj.Triangle, t1, BGColors.Blue, isActive)}
      //   {resizedStrs.congruent}
      //   {chipText(Obj.Triangle, t2, BGColors.Purple, isActive)}
      // </span>
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
  static highlight = (
    ctx: Content,
    frame: string,
    [t1, t2]: [string, string]
  ) => {
    ctx.getTriangle(t1).highlight(frame);
    ctx.getTriangle(t2).highlight(frame);
  };
}
