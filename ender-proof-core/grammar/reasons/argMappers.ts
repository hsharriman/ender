import { DiagramContent } from "../../geometry/DiagramContent";
import { Stmt } from "../../types/types";

export const conTriMapper = (conTri: Stmt, ctx: DiagramContent) => {
  return conTri.arguments.map((arg) => ctx.addTriangleFromStr(arg.v));
};

export const conSegMapper = (conSeg: Stmt, ctx: DiagramContent) => {
  return conSeg.arguments.map((arg) => ctx.addSegmentFromStr(arg.v));
};

export const conAngMapper = (conAng: Stmt, ctx: DiagramContent) => {
  return conAng.arguments.map((arg) => ctx.addAngleFromStr(arg.v));
};
