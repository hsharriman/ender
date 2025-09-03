import { Angle } from "../../geometry/Angle";
import { DiagramContent } from "../../geometry/DiagramContent";
import { Point } from "../../geometry/Point";
import { Segment } from "../../geometry/Segment";
import { Stmt } from "../../types/checkerTypes";

export const reflex_a = (a1: Angle, a2: Angle) => {
  return a1.equals(a2);
};

export const right = (
  perp: Stmt,
  right: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2] = perp.arguments.map((arg) =>
    tempCtx.addSegmentFromStr(arg.v)
  );
  const r = tempCtx.addAngleFromStr(right.arguments[0].v);

  let valid = false;
  // angle includes one of the segments and a point from the other
  if (r.contains(s1)) {
    valid = r.contains(s2.p1) || r.contains(s2.p2);
  } else if (r.contains(s2)) {
    valid = r.contains(s1.p1) || r.contains(s1.p2);
  }
  if (valid) {
    ctx.addAngle(r);
  }
  return valid;
};

export const vert_ang = (
  intersect_seg: Stmt,
  conAng: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2, pt]: [Segment, Segment, Point] = [
    tempCtx.addSegmentFromStr(intersect_seg.arguments[0].v),
    tempCtx.addSegmentFromStr(intersect_seg.arguments[1].v),
    tempCtx.getPoint(intersect_seg.arguments[2].v),
  ];
  const [a1, a2] = conAng.arguments.map((arg) =>
    tempCtx.addAngleFromStr(arg.v)
  );

  // Check that angles don't include segment names (vertical angles must be across from each other)
  const anglesValid =
    !a1.contains(s1) &&
    !a1.contains(s2) &&
    !a2.contains(s1) &&
    !a2.contains(s2);

  const centerValid = a1.centerEquals(pt) && a2.centerEquals(pt);

  if (anglesValid && centerValid) {
    ctx.addAngle(a1);
    ctx.addAngle(a2);

    // add intersecting lines if DNE yet
    ctx.addSegmentFromStr(s1.label);
    ctx.addSegmentFromStr(s2.label);
  }
  return anglesValid && centerValid;
};

export const ang_bisect = (conAng: Stmt, bisect: Stmt, ctx: DiagramContent) => {
  const tempCtx = new DiagramContent(ctx.getCtx());

  const [a1, a2] = conAng.arguments.map((arg) =>
    tempCtx.addAngleFromStr(arg.v)
  );
  const [ang, seg] = [
    tempCtx.addAngleFromStr(bisect.arguments[0].v),
    tempCtx.addSegmentFromStr(bisect.arguments[1].v),
  ];

  // check if corner of a1/a2 is on seg + corner of ang
  // and if both small angles contain the bisecting segment
  return (
    a1.equals(a2) &&
    a1.contains(seg) &&
    a2.contains(seg) &&
    a1.centerEquals(a2.center) &&
    a1.centerEquals(ang.center)
  );
};
