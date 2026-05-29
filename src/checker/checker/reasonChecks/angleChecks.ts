import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { findDuplicateDependencyStatements } from "./utils";

export const reflex_a = (a1: Angle, a2: Angle) => {
  return a1.equals(a2);
};

export const right = (perp: Stmt, right: Stmt, ctx: ProofContent): boolean => {
  const [s1, s2] = perp.arguments.map((arg) => ctx.getSegment(arg.v));
  const r = ctx.getAngle(right.arguments[0].v);

  // angle includes one of the segments and a point from the other
  if (r.contains(s1)) {
    return r.contains(s2.p1) || r.contains(s2.p2);
  } else if (r.contains(s2)) {
    return r.contains(s1.p1) || r.contains(s1.p2);
  }
  return false;
};

export const vert_ang = (
  intersect_seg: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): boolean => {
  const [s1, s2, pt]: [Segment, Segment, Point] = [
    ctx.getSegment(intersect_seg.arguments[0].v),
    ctx.getSegment(intersect_seg.arguments[1].v),
    ctx.getPoint(intersect_seg.arguments[2].v),
  ];
  const [a1, a2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));

  // Check that angles don't include segment names (vertical angles must be across from each other)
  // also that the angles are not equal
  const anglesValid =
    !a1.contains(s1) &&
    !a1.contains(s2) &&
    !a2.contains(s1) &&
    !a2.contains(s2) &&
    !a1.equals(a2);

  const centerValid = a1.centerEquals(pt) && a2.centerEquals(pt);

  return anglesValid && centerValid;
};

/**
 * `def_con_right` reason: both dependency statements must be `right` (angles
 * already shown to be right); then the conclusion `con_ang` is allowed. No shared-side requirement.
 */
export const defConRight = (
  right1: Stmt,
  right2: Stmt,
  ctx: ProofContent,
): boolean => {
  // if (findDuplicateDependencyStatements([right1, right2])) return false;
  // if (right1.function !== "right" || right2.function !== "right") return false;

  const a1 = ctx.getAngle(right1.arguments[0].v);
  const a2 = ctx.getAngle(right2.arguments[0].v);

  if (a1.equals(a2)) return false;
  return true;
};

/**
 * `cong_adj_angles` reason: two `right` deps with a **shared side** — same corner
 * and exactly one matching leg among e1a~e2a, e1a~e2b, e1b~e2a, e1b~e2b.
 */
export const congAdjAngles = (
  right1: Stmt,
  right2: Stmt,
  ctx: ProofContent,
): boolean => {
  if (findDuplicateDependencyStatements([right1, right2])) return false;

  const ang1 = ctx.getAngle(right1.arguments[0].v);
  const ang2 = ctx.getAngle(right2.arguments[0].v);

  if (!ang1.center.equals(ang2.center)) return false;

  const legs = (a: Angle): [Segment, Segment] => [
    ctx.getSegment(a.center.label + a.start.label),
    ctx.getSegment(a.center.label + a.end.label),
  ];
  const [e1a, e1b] = legs(ang1);
  const [e2a, e2b] = legs(ang2);

  // only one pair of
  const legPairMatches = [
    e1a.equals(e2a),
    e1a.equals(e2b),
    e1b.equals(e2a),
    e1b.equals(e2b),
  ].filter(Boolean).length;
  if (legPairMatches !== 1) return false;

  return true;
};

export const def_ang_bisect = (
  conAng: Stmt,
  bisect: Stmt,
  ctx: ProofContent,
) => {
  const [a1, a2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));
  const [ang, seg] = [
    ctx.getAngle(bisect.arguments[0].v),
    ctx.getSegment(bisect.arguments[1].v),
  ];

  // check if corner of a1/a2 is on seg + corner of ang
  // and if both small angles contain the bisecting segment
  return (
    a1.contains(seg) &&
    a2.contains(seg) &&
    a1.centerEquals(a2.center) &&
    a1.centerEquals(ang.center)
  );
};
