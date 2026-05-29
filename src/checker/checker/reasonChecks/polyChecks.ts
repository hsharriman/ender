import { ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper } from "./argMappers";

export const rectangle = (rect: Stmt, conclusion: Stmt, ctx: ProofContent) => {
  const quad = ctx.getQuadrilateral(rect.arguments[0].v);
  if (
    conclusion.function === "con_right" ||
    conclusion.function === "con_ang"
  ) {
    const [a1, a2] = conAngMapper(conclusion, ctx);
    return quad.contains(a1) && quad.contains(a2);
  }
  if (conclusion.function === "con_seg") {
    const [s1, s2] = conSegMapper(conclusion, ctx);
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

export const parallelogram2 = (para: Stmt, pgram: Stmt, ctx: ProofContent) => {
  const quad = ctx.getQuadrilateral(para.arguments[0].v);
  const [s1, s2] = conSegMapper(pgram, ctx);

  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};
