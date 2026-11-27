import { arcStr, congruent } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class EqualArcs {
  static additions = (props: StepFocusProps, [a1, a2]: [string, string]) => {
    props.ctx.getArc(a1)?.mode(props.frame, props.mode);
    props.ctx.getArc(a2)?.mode(props.frame, props.mode);
  };
  static text =
    ([s1, s2]: [string, string]) =>
    (isActive: boolean) => {
      // The arc `r_OAB`, read as `OAB`, is drawn as the arc AB.
      const [first, second] = [s1, s2].map((arc) => arc.slice(1));
      return (
        <span>
          {arcStr(first, isActive)}
          {congruent}
          {arcStr(second, isActive)}
        </span>
      );
    };
}
