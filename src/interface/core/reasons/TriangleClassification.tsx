import { triangleStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class TriangleClassification {
  static text = (t: string, type: string) => (isActive: boolean) => {
    return (
      <span>
        {triangleStr(t)}
        {" is "}
        {type}
      </span>
    );
  };
  static additions = (props: StepFocusProps, t: string) => {
    const tri = props.ctx.getTriangle(t);
    if (!tri) return;
    tri.s.forEach((sb) =>
      props.ctx.getSegment(sb.obj.label)?.mode(props.frame, props.mode),
    );
  };
}
