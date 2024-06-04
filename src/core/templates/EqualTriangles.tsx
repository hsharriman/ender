import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { congruent, triangleStr } from "../geometryText";
import { StepTextProps } from "../types/stepTypes";

export class EqualTriangles {
  static text = (props: StepTextProps, [t1, t2]: [string, string]) => {
    const t1s = props.ctx.getTriangle(t1);
    const t2s = props.ctx.getTriangle(t2);
    return (
      <span>
        {linked(t1, t1s)}
        {congruent}
        {linked(t2, t2s)}
      </span>
    );
  };
  static ticklessText = (ctx: Content, [t1, t2]: [string, string]) => {
    return EqualTriangles.text({ ctx }, [t1, t2]);
  };
  static staticText = (t: [string, string]) => {
    return (
      <span>
        {triangleStr(t[0])}
        {congruent}
        {triangleStr(t[1])}
      </span>
    );
  };
}