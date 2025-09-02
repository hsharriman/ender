import { DiagramContent } from "../../geometry/DiagramContent";
import { Stmt } from "../../types/types";

export const rectangle = (rect: Stmt, conSeg: Stmt, ctx: DiagramContent) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const quad = tempCtx.addQuadrilateralFromStr(rect.arguments[0]);

  const [s1, s2] = [
    tempCtx.addSegmentFromStr(conSeg.arguments[0]),
    tempCtx.addSegmentFromStr(conSeg.arguments[1]),
  ];

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

  const [s1, s2] = [
    tempCtx.addSegmentFromStr(pgram.arguments[0]),
    tempCtx.addSegmentFromStr(pgram.arguments[1]),
  ];

  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};
