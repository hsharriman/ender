import { Stmt } from "checker/types/checkerTypes";
import { SVGModes } from "../types/diagramTypes";
import { StepProps } from "../types/stepTypes";

/**
 * Diagram premise `transversal(s1p1, s1p2, t1, i1, s2p1, s2p2, t2, i2)`.
 * Highlights full lines `s1p1s1p2`, `s2p1s2p2`, and transversal `t1t2`.
 */
export class Transversal {
  static highlight(props: StepProps, stmt: Stmt): void {
    if (stmt.function !== "transversal" || stmt.arguments.length !== 8) return;
    const { ctx, frame } = props;
    const [s1p1, s1p2, t1, _i1, s2p1, s2p2, t2, _i2] = stmt.arguments.map(
      (a) => a.v,
    );
    const segLabels = [
      `${s1p1}${s1p2}`,
      `${s2p1}${s2p2}`,
      `${t1}${t2}`,
    ];
    for (const label of segLabels) {
      ctx.getSegment(label)?.mode(frame, SVGModes.ReliesOn);
    }
  }
}
