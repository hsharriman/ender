import { DiagramContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper } from "./argMappers";

export const rectangle = (
  rect: Stmt,
  conclusion: Stmt,
  ctx: DiagramContent
) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const quad = tempCtx.addQuadrilateralFromStr(rect.arguments[0].v);
  if (
    conclusion.function === "con_right" ||
    conclusion.function === "con_ang"
  ) {
    const [a1, a2] = conAngMapper(conclusion, tempCtx);
    return quad.contains(a1) && quad.contains(a2);
  }
  if (conclusion.function === "con_seg") {
    const [s1, s2] = conSegMapper(conclusion, tempCtx);
    return (
      !s1.equals(s2) &&
      quad.contains(s1) &&
      quad.contains(s2) &&
      !s1.contains(s2.p1) &&
      !s1.contains(s2.p2)
    );
  }

  return false;
};

export const parallelogram2 = (
  para: Stmt,
  pgram: Stmt,
  ctx: DiagramContent
) => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const quad = tempCtx.addQuadrilateralFromStr(para.arguments[0].v);
  const [s1, s2] = conSegMapper(pgram, tempCtx);

  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};
