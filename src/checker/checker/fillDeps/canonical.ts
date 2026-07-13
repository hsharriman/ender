import { Obj, ParseObj, ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";

/**
 * Semantic canonicalization of statements.
 *
 * The existing `stmtKey` is syntactic: `con_seg(AB,CD)`, `con_seg(CD,AB)` and
 * `con_seg(BA,DC)` get three different keys. The keys produced here resolve
 * every argument through ctx so that all spellings of the same geometric fact
 * collapse to one string:
 *  - object labels normalize to the lexicographically smallest entry of the
 *    ctx object's `names` set (segment `BA`→`AB`; angle overlap variants like
 *    `CAM`≡`CAB` merge because `checkAngleOverlaps` unions their names),
 *  - argument pairs of symmetric statements sort.
 *
 * Note on `con_tri`/`sim_tri`: canonicalizing the triangle labels erases the
 * vertex correspondence the label order encodes. Facts asserting the same
 * triangle pair under different correspondences therefore share a key. That
 * is acceptable for deduplication because correspondence-sensitive uses
 * (cpctc) are re-validated geometrically via `checkReasonApplication` and the
 * final full-checker gate.
 */

/** Two-argument statements whose arguments are interchangeable. */
const FULLY_SYMMETRIC = new Set([
  "con_seg",
  "con_ang",
  "con_right",
  "con_tri",
  "para",
  "sim_seg",
  "sim_tri",
  "supplementary",
  "complementary",
  "linear_pair",
  "ref_seg",
  "ref_ang",
  "con_arc",
]);

/** Statements of shape `f(s1, s2, p)` where s1/s2 commute. */
const FIRST_TWO_SYMMETRIC = new Set(["perp", "intersect_seg"]);

const minOf = (names: Iterable<string>): string => {
  let best: string | undefined;
  for (const n of names) {
    if (best === undefined || n < best) best = n;
  }
  return best ?? "";
};

const sortedLetters = (v: string): string => v.split("").sort().join("");

/**
 * Canonical label for one statement argument. Resolves through the ctx object
 * when it exists (covering angle-overlap variants); falls back to a purely
 * syntactic normalization otherwise.
 */
export const canonicalObjLabel = (arg: ParseObj, ctx: ProofContent): string => {
  switch (arg.type) {
    case Obj.Segment: {
      const seg = ctx.getSegment(arg.v);
      return seg ? minOf(seg.names) : sortedLetters(arg.v);
    }
    case Obj.Angle: {
      const ang = ctx.getAngle(arg.v);
      if (ang) return minOf(ang.names);
      const rev = arg.v.split("").reverse().join("");
      return arg.v < rev ? arg.v : rev;
    }
    case Obj.Triangle: {
      const tri = ctx.getTriangle(arg.v);
      return tri ? minOf(tri.names) : sortedLetters(arg.v);
    }
    case Obj.Quadrilateral: {
      const quad = ctx.getQuadrilateral(arg.v);
      return quad ? minOf(quad.names) : sortedLetters(arg.v);
    }
    case Obj.Circle: {
      const circle = ctx.getCircle(arg.v);
      return circle ? minOf(circle.names.size ? circle.names : [arg.v]) : arg.v;
    }
    case Obj.Point:
    default:
      return arg.v;
  }
};

const argKey = (arg: ParseObj, ctx: ProofContent): string =>
  `${arg.type}:${canonicalObjLabel(arg, ctx)}`;

/**
 * Canonical key for a statement's arguments only (no function name). Used to
 * match the same argument tuple across substitutable statement functions
 * (e.g. a `con_right(a1,a2)` fact satisfying a `con_ang(a1,a2)` lookup).
 * Symmetry sorting is applied based on the given function.
 */
export const canonicalArgsKey = (stmt: Stmt, ctx: ProofContent): string => {
  const keys = (stmt.arguments ?? []).map((a) => argKey(a, ctx));
  if (FULLY_SYMMETRIC.has(stmt.function) && keys.length === 2) {
    keys.sort();
  } else if (FIRST_TWO_SYMMETRIC.has(stmt.function) && keys.length === 3) {
    const firstTwo = keys.slice(0, 2).sort();
    keys.splice(0, 2, ...firstTwo);
  }
  return keys.join("|");
};

/** Full canonical key: function + canonical args. */
export const canonicalKey = (stmt: Stmt, ctx: ProofContent): string =>
  `${stmt.function}(${canonicalArgsKey(stmt, ctx)})`;

/** Canonical labels of every object mentioned by the statement (for indexing). */
export const canonicalObjLabels = (stmt: Stmt, ctx: ProofContent): string[] => {
  const out = new Set<string>();
  for (const arg of stmt.arguments ?? []) {
    out.add(canonicalObjLabel(arg, ctx));
  }
  return [...out];
};
