import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { resizedStrs, triangleStr } from "../geometryText";

export class EqualTriangles {
  static text = (ctx: Content, [t1, t2]: [string, string]) => {
    const t1s = ctx.getTriangle(t1);
    const t2s = ctx.getTriangle(t2);
    return (
      <span>
        {linked(t1, t1s)}
        {tooltip(resizedStrs.congruent, definitions.CongruentTriangles)}
        {linked(t2, t2s)}
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
}
