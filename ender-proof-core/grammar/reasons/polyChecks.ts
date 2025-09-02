import { DiagramContent } from "../../geometry/DiagramContent";
import { Stmt } from "../../types/types";
import { conSegMapper } from "./argMappers";

export const rectangle = (rect: Stmt, conSeg: Stmt, ctx: DiagramContent) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const quad = tempCtx.addQuadrilateralFromStr(rect.arguments[0]);
  const [s1, s2] = conSegMapper(conSeg, tempCtx);

  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};

export const parallelogram2 = (
  para: Stmt,
  pgram: Stmt,
  ctx: DiagramContent
) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const quad = tempCtx.addQuadrilateralFromStr(para.arguments[0]);
  const [s1, s2] = conSegMapper(pgram, tempCtx);

  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};
