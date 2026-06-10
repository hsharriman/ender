import {
  Angle,
  BaseGeometryObject,
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
    return reasonApplicationFail("DUP_DEP_STMT", { ...dup });
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
    return reasonApplicationFail("ILLEGAL_REFLEX_STMT", {
      pair: [o1.label, o2.label],
    });
  }
  return reasonApplicationOk();
};
