import {
  Angle,
  BaseGeometryObject,
  Point,
  ProofContent,
  Segment,
  Triangle,
} from "geometry-object";
import { ErrorObj, Stmt } from "../../types/checkerTypes";
import {
  ReasonApplicationResult,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";

/**
 * Returns the first segment from {seg, its subsegments, its parent segments}
 * that satisfies check, or null if none do.
 *
 * Use for property checks (diagonal membership, perpendicularity, bisection,
 * etc.) where a proof may reference a parent or subsegment of the geometrically
 * valid segment. Do NOT use for congruence / similarity / parallel equality
 * checks where segment identity matters.
 */
export const resolveSegmentForProp = (
  seg: Segment,
  check: (s: Segment) => boolean,
): Segment | null => {
  if (check(seg)) return seg;
  for (const sub of seg.getSubSegments()) {
    if (check(sub)) return sub;
  }
  for (const par of seg.getParentSegments()) {
    if (check(par)) return par;
  }
  return null;
};

/**
 * Returns the first name in ang.names for which check passes, or null.
 *
 * ang.names is populated with all overlap-merged variants during premises
 * setup (e.g., QPR also has QPT when T is interior to PR), so iterating names
 * is the angle-side equivalent of traversing segment parent/sub relationships.
 */
export const resolveAngleForProp = (
  ang: Angle,
  check: (name: string) => boolean,
): string | null => {
  return ang.resolveLabel(check);
};

export const segContainsPt = (seg: Segment, pt: Point): boolean =>
  seg.contains(pt) || pt.isOnLine(seg);

/**
 * Returns ok if angle ang is a right angle at p with its two rays lying
 * along s1 and s2.  Handles angle-overlap name variants and parent/child
 * segments: any name of ang whose non-center endpoints land on s1 and s2
 * (one each) satisfies the check.
 */
export const rightAngleOnPerp = (
  ang: Angle,
  s1: Segment,
  s2: Segment,
  p: Point,
  ctx: ProofContent,
): ReasonApplicationResult => {
  if (!ang.centerEquals(p))
    return reasonApplicationFail("angles_dont_share_centerpt");
  if (
    resolveAngleForProp(ang, (name) => {
      const startPt = ctx.getPoint(name[0]);
      const endPt = ctx.getPoint(name[2]);
      if (!startPt || !endPt) return false;
      return (
        (segContainsPt(s1, startPt) && segContainsPt(s2, endPt)) ||
        (segContainsPt(s2, startPt) && segContainsPt(s1, endPt))
      );
    }) === null
  )
    return reasonApplicationFail("shared_side_not_on_perp_segs");
  return reasonApplicationOk();
};

/** Canonical string for comparing statement structure (function + typed args). */
export const stmtKey = (stmt: Stmt): string => {
  const args = (stmt.arguments ?? []).map((a) => `${a.type}:${a.v}`).join("|");
  return `${stmt.function}:${args}`;
};

export const checkDistinctDependencyStmts = (
  deps: Stmt[],
): ReasonApplicationResult => {
  const dup = findDuplicateDependencyStatements(deps);
  if (dup) {
    return reasonApplicationFail("dupe_stmt_supplied", { ...dup });
  }
  return reasonApplicationOk();
};

/**
 * If two or more entries denote the same statement (same `stmtKey`), returns
 * the first pair of indices; otherwise `null`. Use in reason checks that take
 * multiple dependency statements (e.g. SAS/SSS, altint, intersect_seg).
 */
export const findDuplicateDependencyStatements = (
  stmts: Stmt[],
): { firstIndex: number; secondIndex: number } | null => {
  const seen = new Map<string, number>();
  for (let i = 0; i < stmts.length; i++) {
    const key = stmtKey(stmts[i]);
    const prev = seen.get(key);
    if (prev !== undefined) {
      return { firstIndex: prev, secondIndex: i };
    }
    seen.set(key, i);
  }
  return null;
};

export const commonPt = (seg1: string, seg2: string): string => {
  for (const char of seg1) {
    if (seg2.includes(char)) {
      return char;
    }
  }
  return "";
};

export const angCenter = (ang: string) => {
  return ang.replace("a_", "")[1];
};

export const stripAngPrefix = (angles: string[]) => {
  return angles.map((angle) => angle.replace("a_", ""));
};

export const stripTriPrefix = (triangles: string[]) => {
  return triangles.map((triangle) => triangle.replace("t_", ""));
};

export const addError = (errors: ErrorObj[], error: ErrorObj) => {
  if (!errors) {
    return [error];
  }
  return [...errors, error];
};

export const addReasonCheckError = (
  errors: ErrorObj[],
  details: Record<string, unknown>,
) => {
  errors.push({
    type: "reason_dep_type_mismatch",
    data: details,
  });
  return errors;
};

export const getTriFromAngs = (
  a1: Angle,
  a2: Angle,
  ctx: ProofContent,
): Triangle | null => {
  for (const triangle of ctx.getTriangles()) {
    if (triangle.contains(a1) && triangle.contains(a2)) {
      return triangle;
    }
  }
  return null;
};

/**
 * Check if two pairs of segments are equal (regardless of order).
 */
export const segmentPairsEqual = (
  [s1, s2]: [Segment, Segment],
  [s3, s4]: [Segment, Segment],
) => {
  return (s1.equals(s3) && s2.equals(s4)) || (s1.equals(s4) && s2.equals(s3));
};

export const anglePairsEqual = (
  [a1, a2]: [Angle, Angle],
  [a3, a4]: [Angle, Angle],
) => {
  return (a1.equals(a3) && a2.equals(a4)) || (a1.equals(a4) && a2.equals(a3));
};

/**
 * Check if two objects are the same (reflexive property) and return a failure
 * if they are.
 */
export const failReflexStatements = (
  o1: BaseGeometryObject,
  o2: BaseGeometryObject,
) => {
  if (o1.equals(o2)) {
    return reasonApplicationFail("both_stmts_are_the_same_object", {
      pair: [o1.label, o2.label],
    });
  }
  return reasonApplicationOk();
};
