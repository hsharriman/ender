import { StepFocusProps } from "../types/stepTypes";

export class QuadClassification {
  static text = (q: string, type: string) => (isActive: boolean) => {
    return (
      <span>
        {q}
        {" is a "}
        {type === "isos_trapezoid" ? "isosceles trapezoid" : type}
      </span>
    );
  };
  static additions = (props: StepFocusProps, q: string) => {
    const quad = props.ctx.getQuadrilateral(q);
    if (!quad) return;
    quad.s.forEach((sb) =>
      props.ctx.getSegment(sb.obj.label)?.mode(props.frame, props.mode),
    );
  };
}
