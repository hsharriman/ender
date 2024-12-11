import { resizedStrs, triangleStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class EqualTriangles {
  static text =
    ([t1, t2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {triangleStr(t1)}
          {resizedStrs.congruent}
          {triangleStr(t2)}
        </span>
      );
    };
  static additions = (props: StepFocusProps, [t1, t2]: [string, string]) => {
    props.ctx.getTriangle(t1).mode(props.frame, props.mode);
    props.ctx.getTriangle(t2).mode(props.frame, props.mode);
  };
}
