import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import { findDuplicateDependencyStatements } from "./utils";

export const reflex_a = (a1: Angle, a2: Angle) => {
  return a1.equals(a2);
};

export const right = (perp: Stmt, right: Stmt, ctx: ProofContent): boolean => {
  const [s1, s2, p] = stmtMapper(perp, ctx) as [Segment, Segment, Point];
  const [r] = stmtMapper(right, ctx) as [Angle];
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
  const [a1, a2] = stmtMapper(supplementary, ctx) as [Angle, Angle];
  const [l1, l2] = stmtMapper(linearPair, ctx) as [Angle, Angle];

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
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

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
  const [a1, a2] = stmtMapper(supp, ctx) as [Angle, Angle];
  const [b1, b2] = stmtMapper(supp2, ctx) as [Angle, Angle];
  const [s1, s2] = stmtMapper(sharedConAng, ctx) as [Angle, Angle];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

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
  const [s1, s2, pt] = stmtMapper(intersect_seg, ctx) as [Segment, Segment, Point];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];

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

  const [a1] = stmtMapper(right1, ctx) as [Angle];
  const [a2] = stmtMapper(right2, ctx) as [Angle];

  if (a1.equals(a2)) return false;
  return true;
};

export const def_ang_bisect = (
  conAng: Stmt,
  bisect: Stmt,
  ctx: ProofContent,
) => {
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  const [ang, seg] = stmtMapper(bisect, ctx) as [Angle, Segment];

  // check if corner of a1/a2 is on seg + corner of ang
  // and if both small angles contain the bisecting segment
  return (
    a1.contains(seg) &&
    a2.contains(seg) &&
    a1.centerEquals(a2.center) &&
    a1.centerEquals(ang.center)
  );
};
