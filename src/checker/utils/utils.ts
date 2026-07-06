import {
  Angle,
  Circle,
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
): Point | Segment | Angle | Triangle | Quadrilateral | Circle => {
  switch (arg.type) {
    case Obj.Angle:
      const angle = ctx.getAngle(arg.v);
      return angle;
    case Obj.Triangle:
      const triangle = ctx.getTriangle(arg.v);
      return triangle;
    case Obj.Quadrilateral:
      const quadrilateral = ctx.getQuadrilateral(arg.v);
      return quadrilateral;
    case Obj.Segment:
      const segment = ctx.getSegment(arg.v);
      return segment;
    case Obj.Point:
      const point = ctx.getPoint(arg.v);
      return point;
    case Obj.Circle:
      const circle = ctx.getCircle(arg.v);
      return circle;
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

