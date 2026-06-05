import { Angle, ProofContent } from "geometry-object";
import { Quadrilateral } from "geometry-object/geometry/Quadrilateral";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper } from "./argMappers";

// Checks whether the quad contains the angle, retrying with all of the
// angle's overlap-merged names when the direct label match fails.
const quadContainsAngle = (quad: Quadrilateral, a: Angle): boolean => {
  if (quad.contains(a)) return true;
  return a.resolveLabel((name) => quad.a.some((qa) => qa.names.has(name))) !== null;
};

export const rectangle = (rect: Stmt, conclusion: Stmt, ctx: ProofContent) => {
  const quad = ctx.getQuadrilateral(rect.arguments[0].v);
  if (
    conclusion.function === "con_right" ||
    conclusion.function === "con_ang"
  ) {
    const [a1, a2] = conAngMapper(conclusion, ctx);
    return quadContainsAngle(quad, a1) && quadContainsAngle(quad, a2);
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

export const def_parallelogram = (
  para: Stmt,
  pgram: Stmt,
  ctx: ProofContent,
) => {
  const quad = ctx.getQuadrilateral(para.arguments[0].v);
  const [s1, s2] = conSegMapper(pgram, ctx);

  // TODO revisit this logic?
  return (
    quad.contains(s1) &&
    quad.contains(s2) &&
    !s1.contains(s1.p1) &&
    !s1.contains(s1.p2)
  );
};
