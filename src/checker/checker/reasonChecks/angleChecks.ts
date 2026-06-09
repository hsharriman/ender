import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { findDuplicateDependencyStatements } from "./utils";

export const reflex_a = (a1: Angle, a2: Angle) => {
  return a1.equals(a2);
};

export const right = (perp: Stmt, right: Stmt, ctx: ProofContent): boolean => {
  const [s1, s2] = [
    ctx.getSegment(perp.arguments[0].v),
    ctx.getSegment(perp.arguments[1].v),
  ];
  const p = ctx.getPoint(perp.arguments[2].v);
  const r = ctx.getAngle(right.arguments[0].v);
  if (!p) return false;

  const startLabel = r.start.label;
  const endLabel = r.end.label;
  return (
    r.centerEquals(p) &&
    ((s1.label.includes(startLabel) && s2.label.includes(endLabel)) ||
      (s2.label.includes(startLabel) && s1.label.includes(endLabel)))
  );
};

export const linear_pair = (
  linearPair: Stmt,
  supplementary: Stmt,
  ctx: ProofContent,
) => {
  const [a1, a2] = supplementary.arguments.map((arg) => ctx.getAngle(arg.v));
  const [l1, l2] = linearPair.arguments.map((arg) => ctx.getAngle(arg.v));

  // angles referenced by linear pair must be same as supplementary
  return (a1.equals(l1) && a2.equals(l2)) || (a1.equals(l2) && a2.equals(l1));
};

// test for congruent supplements/complements where each pair of angles is supp/comp to the same angle
export const con_supp_comp_same_angle = (
  supp: Stmt,
  supp2: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
) => {
  if (findDuplicateDependencyStatements([supp, supp2, conAng])) return false;
  const [a1, a2] = supp.arguments.map((arg) => ctx.getAngle(arg.v));
  const [b1, b2] = supp2.arguments.map((arg) => ctx.getAngle(arg.v));
  const [c1, c2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));

  // shared angle must appear exactly once in each supp statement
  const shared = [a1, a2].find((a) => a.equals(b1) || a.equals(b2));
  if (!shared) return false;
  if ([a1, a2].filter((a) => a.equals(shared)).length !== 1) return false;
  if ([b1, b2].filter((a) => a.equals(shared)).length !== 1) return false;

  // c1 and c2 must be the non-shared angle from each supp
  const remaining1 = [a1, a2].find((a) => !a.equals(shared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(shared))!;
  return (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  );
};

// test for con supplements/complements where the angles are supp/comp to 2 diff angs that are con to each other
export const con_supp_comp_diff_angles = (
  supp: Stmt,
  supp2: Stmt,
  sharedConAng: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
) => {
  if (findDuplicateDependencyStatements([supp, supp2, conAng])) return false;
  const [a1, a2] = supp.arguments.map((arg) => ctx.getAngle(arg.v));
  const [b1, b2] = supp2.arguments.map((arg) => ctx.getAngle(arg.v));
  const [s1, s2] = sharedConAng.arguments.map((arg) => ctx.getAngle(arg.v));
  const [c1, c2] = conAng.arguments.map((arg) => ctx.getAngle(arg.v));

  if (c1.equals(c2) || s1.equals(s2)) return false;

  const s1InSupp = [a1, a2].filter((a) => a.equals(s1)).length === 1;
  const s1InSupp2 = [b1, b2].filter((a) => a.equals(s1)).length === 1;
  const s2InSupp = [a1, a2].filter((a) => a.equals(s2)).length === 1;
  const s2InSupp2 = [b1, b2].filter((a) => a.equals(s2)).length === 1;

  // each shared angle must be in exactly one of supp or supp2
  if (s1InSupp === s1InSupp2 || s2InSupp === s2InSupp2) return false;
  // s1 and s2 must be in different supp statements
  if (s1InSupp === s2InSupp) return false;

  // remaining angles (one from each supp) must be exactly c1 and c2
  const [suppShared, supp2Shared] = s1InSupp ? [s1, s2] : [s2, s1];
  const remaining1 = [a1, a2].find((a) => !a.equals(suppShared))!;
  const remaining2 = [b1, b2].find((a) => !a.equals(supp2Shared))!;

  return (
    (remaining1.equals(c1) && remaining2.equals(c2)) ||
    (remaining1.equals(c2) && remaining2.equals(c1))
  );
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
