import { strs, triangleStr } from "../geometryText";
import { SVGModes } from "../types/diagramTypes";
import { StepFocusProps, StepProps } from "../types/stepTypes";

export class SimilarTriangles {
  static text =
    ([t1, t2]: [string, string]) =>
    (isActive: boolean) => {
      return (
        <span>
          {triangleStr(t1)}
          {strs.similar}
          {triangleStr(t2)}
        </span>
      );
    };
  static additions = (props: StepFocusProps, [t1, t2]: [string, string]) => {
    props.ctx.getTriangle(t1)?.mode(props.frame, props.mode);
    props.ctx.getTriangle(t2)?.mode(props.frame, props.mode);
  };

  static congruentLabel = (
    props: StepProps,
    labels: [string, string],
    mode: SVGModes,
  ) => {
    const { ctx, frame } = props;
    ctx.getTriangle(labels[0])?.setSimilar(frame).labelMode(frame, mode);
    const t2 = ctx.getTriangle(labels[1]);
    if (!t2) return;
    t2.setRotatePattern(true);
    t2.setSimilar(frame).labelMode(frame, mode);
  };
}
