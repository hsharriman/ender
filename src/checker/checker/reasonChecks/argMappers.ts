import { ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";

export const conTriMapper = (conTri: Stmt, ctx: ProofContent) => {
  return conTri.arguments.map((arg) => ctx.addTriangleFromStr(arg.v));
};

export const conSegMapper = (conSeg: Stmt, ctx: ProofContent) => {
  return conSeg.arguments.map((arg) => ctx.addSegmentFromStr(arg.v));
};

export const conAngMapper = (conAng: Stmt, ctx: ProofContent) => {
  return conAng.arguments.map((arg) => ctx.addAngleFromStr(arg.v));
};
