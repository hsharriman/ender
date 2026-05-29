import { ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";

export const conTriMapper = (conTri: Stmt, ctx: ProofContent) => {
  return conTri.arguments.map((arg) => ctx.getTriangle(arg.v));
};

export const conSegMapper = (conSeg: Stmt, ctx: ProofContent) => {
  return conSeg.arguments.map((arg) => ctx.getSegment(arg.v));
};

export const conAngMapper = (conAng: Stmt, ctx: ProofContent) => {
  return conAng.arguments.map((arg) => ctx.getAngle(arg.v));
};
