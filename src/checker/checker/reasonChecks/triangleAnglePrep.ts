import { ProofContent, Triangle } from "../../../geometry-object";
import { Stmt } from "../../types/checkerTypes";

/** Resolve overlapping `con_ang` labels to each triangle's interior angle before triangle rules run. */
export const prepareCongruentAngForTriangles = (
  conAng: Stmt,
  tri1: Triangle,
  tri2: Triangle,
  ctx: ProofContent,
): Stmt => ctx.resolveCongruentAngForTriangles(conAng, tri1, tri2) as Stmt;
