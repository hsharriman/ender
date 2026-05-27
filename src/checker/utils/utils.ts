import { createError } from "checker/errors/errorConstants";
import {
  Angle,
  Obj,
  ParseObj,
  Point,
  ProofContent,
  Quadrilateral,
  Segment,
  Triangle,
} from "geometry-object";

// Function to get geometric object from string identifier
export const getGeometricObject = (
  arg: ParseObj,
  ctx: ProofContent,
): Point | Segment | Angle | Triangle | Quadrilateral => {
  switch (arg.type) {
    case Obj.Angle:
      const angle = ctx.getAngle(arg.v);
      if (!angle) {
        throw createError.geometric.angleNotFound(arg.v);
      }
      return angle;
    case Obj.Triangle:
      const triangle = ctx.getTriangle(arg.v);
      if (!triangle) {
        throw createError.geometric.triangleNotFound(arg.v);
      }
      return triangle;
    case Obj.Quadrilateral:
      const quadrilateral = ctx.getQuadrilateral(arg.v);
      if (!quadrilateral) {
        throw createError.geometric.quadrilateralNotFound(arg.v);
      }
      return quadrilateral;
    case Obj.Segment:
      const segment = ctx.getSegment(arg.v);
      if (!segment) {
        throw createError.geometric.segmentNotFound(arg.v);
      }
      return segment;
    case Obj.Point:
      const point = ctx.getPoint(arg.v);
      if (!point) {
        throw createError.geometric.pointNotFound(arg.v);
      }
      return point;
    default:
      throw createError.geometric.cannotParseGeometricObject(arg.v);
  }
};

export const pointtoParseObj = (p: Point): ParseObj => {
  return { type: Obj.Point, v: p.label };
};

export const segtoParseObj = (s: Segment): ParseObj => {
  return { type: Obj.Segment, v: s.label };
};

export const angParseObj = (a: Angle): ParseObj => {
  return { type: Obj.Angle, v: a.label };
};

export const tritoParseObj = (t: Triangle): ParseObj => {
  return { type: Obj.Triangle, v: t.label };
};

export const quadtoParseObj = (q: Quadrilateral): ParseObj => {
  return { type: Obj.Quadrilateral, v: q.label };
};
