import { ErrorType } from "checker/errors/errorConstants";
import {
  Angle,
  Obj,
  ParseObj,
  ProofContent,
  Segment,
  Triangle,
} from "../../../geometry-object";
import { Stmt, TriCorrespondence } from "../../types/checkerTypes";
import {
  CheckerResult,
  ErrorDetails,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";
import {
  angCenter,
  commonPt,
  getTriFromAngs,
  resolveAngleForProp,
  stmtMapper,
} from "./utils";

const NOT_ASSIGNABLE = "element_not_assignable_to_either_triangle";
const NOT_EXCLUSIVE = "con_pair_not_assigned_to_separate_triangles";
const SAS_BAD = "angle_center_not_bw_both_con_segs";
const AAS_BAD = "seg_touches_both_or_neither_con_angle";
const ASA_BAD = "seg_not_bw_both_con_angles";
const RHL_BAD = "rhl_first_seg_must_be_hypotenuse_and_second_must_be_leg";
const SEG_NOT_CORRESP = "segs_not_corresponding_in_triangles";
const ANG_NOT_CORRESP = "angles_not_corresponding_in_triangles";
const BAD_CONC_TYPE = "conclusion_must_be_con_seg_or_con_ang";
const NOT_UNIQUE_DIST =
  "con_pairs_dont_cover_each_side_and_angle_of_both_triangles_exactly_once";
const TRI_NOT_FOUND = "triangle_not_found_from_con_angles";
const ANGS_NOT_UNIQUE =
  "con_angle_pairs_dont_cover_each_angle_of_both_triangles_exactly_once";
const NOT_ISOS_SIDES = "con_segs_not_two_distinct_sides_of_isosceles_triangle";
const BASE_ANG_BAD = "base_angle_vertex_not_at_endpoint_of_exactly_one_leg";
const DIFF_TRIANGLES = "equilateral_and_equiangular_not_the_same_triangle";
const NOT_TWO_SIDES = "not_all_sides_appear_exactly_twice_in_con_segs";
const NOT_TWO_ANGS = "not_all_angles_appear_exactly_twice_in_con_angs";
const SEGS_NOT_DISTINCT = "con_seg_pairs_reuse_the_same_side_of_a_triangle";
const ANGS_NOT_DISTINCT = "con_ang_pairs_reuse_the_same_angle_of_a_triangle";
const SSS_SEGS_NOT_UNIQUE =
  "con_seg_pairs_dont_cover_all_three_sides_of_both_triangles_exactly_once";
const BAD_VERTEX_ORDER = "derived_vertex_order_is_not_a_permutation_of_triangle";
const NO_CORRESPONDENCE = "con_tri_dependency_has_no_vertex_correspondence";
const CORRESP_TRI_MISMATCH =
  "con_tri_dependency_does_not_relate_these_two_triangles";

type TriangleAssignResult = { ok: true; left: string; right: string };

/** True when two labels denote the same segment of the figure. */
const sameSeg = (a: string, b: string, ctx: ProofContent) => {
  const s1 = ctx.getSegment(a);
  const s2 = ctx.getSegment(b);
  return !!s1 && !!s2 && s1.equals(s2);
};

/** True when two labels denote the same angle of the figure. */
const sameAng = (a: string, b: string, ctx: ProofContent) => {
  const a1 = ctx.getAngle(a);
  const a2 = ctx.getAngle(b);
  return !!a1 && !!a2 && a1.equals(a2);
};

/**
 * Rejects a reason that cites the same side of a triangle for two different
 * side slots. Such a citation leaves the remaining side unconstrained, so the
 * congruence does not follow.
 */
const distinctSegs = (
  tri1: Triangle,
  l1: string,
  l2: string,
  tri2: Triangle,
  r1: string,
  r2: string,
  ctx: ProofContent,
): CheckerResult => {
  if (sameSeg(l1, l2, ctx)) {
    return reasonApplicationFail(SEGS_NOT_DISTINCT, {
      tri: tri1.label,
      segs: [l1, l2],
    });
  }
  if (sameSeg(r1, r2, ctx)) {
    return reasonApplicationFail(SEGS_NOT_DISTINCT, {
      tri: tri2.label,
      segs: [r1, r2],
    });
  }
  return reasonApplicationOk();
};

/** Angle counterpart of `distinctSegs`. */
const distinctAngs = (
  tri1: Triangle,
  l1: string,
  l2: string,
  tri2: Triangle,
  r1: string,
  r2: string,
  ctx: ProofContent,
): CheckerResult => {
  if (sameAng(l1, l2, ctx)) {
    return reasonApplicationFail(ANGS_NOT_DISTINCT, {
      tri: tri1.label,
      angs: [l1, l2],
    });
  }
  if (sameAng(r1, r2, ctx)) {
    return reasonApplicationFail(ANGS_NOT_DISTINCT, {
      tri: tri2.label,
      angs: [r1, r2],
    });
  }
  return reasonApplicationOk();
};

/**
 * Records the vertex pairing a congruence reason establishes.
 *
 * `p1[k]` pairs with `p2[k]`. Both triples must permute their own triangle's
 * vertices. A triple built from congruent-part pairs that reuse a side or an
 * angle does not, and describes no correspondence.
 */
const buildCorrespondence = (
  tri1: Triangle,
  p1: [string, string, string],
  tri2: Triangle,
  p2: [string, string, string],
): CheckerResult => {
  for (const [tri, order] of [
    [tri1, p1],
    [tri2, p2],
  ] as [Triangle, [string, string, string]][]) {
    if (!tri.isVertexPermutation(order)) {
      return reasonApplicationFail(BAD_VERTEX_ORDER, {
        tri: tri.label,
        order,
      });
    }
  }
  return reasonApplicationOk({
    tris: [tri1.label, tri2.label],
    pts: [p1, p2],
  });
};

/**
 * Reads a correspondence in the direction `from` → `to`, or null when it does
 * not relate exactly those two triangles.
 */
const vertexMap = (
  correspondence: TriCorrespondence,
  from: Triangle,
  to: Triangle,
): Map<string, string> | null => {
  const { tris, pts } = correspondence;
  const forward = tris[0] === from.label && tris[1] === to.label;
  const backward = tris[1] === from.label && tris[0] === to.label;
  if (!forward && !backward) return null;
  const [src, dst] = forward ? [pts[0], pts[1]] : [pts[1], pts[0]];
  return new Map(src.map((label, i) => [label, dst[i]]));
};

/** The endpoints of the triangle side that `name` denotes, or null. */
const triSegPts = (tri: Triangle, name: string): [string, string] | null => {
  const seg = tri.s.find((s) => s.names.has(name));
  return seg ? [seg.p1.label, seg.p2.label] : null;
};

/** The (start, center, end) of the triangle angle that `name` denotes, or null. */
const triAngPts = (
  tri: Triangle,
  name: string,
): [string, string, string] | null => {
  const ang = tri.a.find((a) => a.names.has(name));
  return ang ? [ang.start.label, ang.center.label, ang.end.label] : null;
};

// Returns the ParseObj form that the triangle actually recognises, resolving
// through angle overlap names in ctx when the raw label isn't in the triangle.
const resolveForTri = (
  obj: ParseObj,
  tri: Triangle,
  ctx: ProofContent,
): ParseObj | null => {
  if (tri.containsParseObj(obj)) return obj;
  if (obj.type !== Obj.Angle) return null;
  const ang = ctx.getAngle(obj.v);
  const resolved =
    ang &&
    resolveAngleForProp(ang, (name) =>
      tri.containsParseObj({ ...obj, v: name }),
    );
  return resolved ? { ...obj, v: resolved } : null;
};

const sortPairToTri = (
  pair: ParseObj[],
  [tri1, tri2]: [Triangle, Triangle],
  ctx: ProofContent,
):
  | { ok: true; left: ParseObj; right: ParseObj }
  | { ok: false; failure: ErrorDetails } => {
  const [l, r] = pair;
  const l1 = resolveForTri(l, tri1, ctx);
  const r2 = resolveForTri(r, tri2, ctx);
  if (l1 && r2) return { ok: true, left: l1, right: r2 };

  const r1 = resolveForTri(r, tri1, ctx);
  const l2 = resolveForTri(l, tri2, ctx);
  if (r1 && l2) return { ok: true, left: r1, right: l2 };

  return {
    ok: false,
    failure: {
      type: ErrorType.ReasonApplicationFail,
      code: NOT_ASSIGNABLE,
      details: { left: l.v, right: r.v, tri1: tri1.label, tri2: tri2.label },
    },
  };
};

const assignToTri = (
  pair: ParseObj[],
  tri1: Triangle,
  tri2: Triangle,
  ctx: ProofContent,
): { res: CheckerResult; l: string; r: string } => {
  const defaultReturn = { res: reasonApplicationOk(), l: "", r: "" };
  const sorted = sortPairToTri(pair, [tri1, tri2], ctx);
  if (!sorted.ok) {
    return { ...defaultReturn, res: sorted };
  }

  const { left, right } = sorted;
  const obj1_in_t1 = tri1.containsParseObj(left);
  const obj2_in_t2 = tri2.containsParseObj(right);
  const obj1_in_t2 = tri2.containsParseObj(left);
  const obj2_in_t1 = tri1.containsParseObj(right);

  // identical congruent sides are only valid if the object is in both tri
  const sharedValid =
    left.v === right.v && obj1_in_t1 && obj1_in_t2 && obj2_in_t1 && obj2_in_t2;

  const valid =
    sharedValid ||
    (obj1_in_t1 && obj2_in_t2 && !obj1_in_t2 && !obj2_in_t1) ||
    (obj1_in_t2 && obj2_in_t1 && !obj1_in_t1 && !obj2_in_t2);

  if (!valid) {
    return {
      ...defaultReturn,
      res: reasonApplicationFail(NOT_EXCLUSIVE, {
        left: left.v,
        right: right.v,
      }),
    };
  }
  return { ...defaultReturn, l: left.v, r: right.v };
};

/** Validates SAS and updates triangle vertex order in `ctx` when valid. */
export const checkSas = (
  conTri: Stmt,
  conSeg1: Stmt,
  conAng: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(conTri, ctx) as [Triangle, Triangle];

  const s1 = assignToTri(conSeg1.arguments, tri1, tri2, ctx);
  if (!s1.res.ok) return s1.res;
  const s2 = assignToTri(conSeg2.arguments, tri1, tri2, ctx);
  if (!s2.res.ok) return s2.res;
  const a = assignToTri(conAng.arguments, tri1, tri2, ctx);
  if (!a.res.ok) return a.res;

  const [al, ar] = [angCenter(a.l), angCenter(a.r)];
  const check = (tri: Triangle, s1: string, a: string, s2: string) => {
    return s1.includes(a) && s2.includes(a)
      ? reasonApplicationOk()
      : reasonApplicationFail(SAS_BAD, {
          a,
          s1,
          s2,
          tri: tri.label,
        });
  };

  const sasLPattern = check(tri1, s1.l, al, s2.l);
  if (!sasLPattern.ok) return sasLPattern;
  const sasRPattern = check(tri2, s1.r, ar, s2.r);
  if (!sasRPattern.ok) return sasRPattern;

  const distinct = distinctSegs(tri1, s1.l, s2.l, tri2, s1.r, s2.r, ctx);
  if (!distinct.ok) return distinct;

  const [pl, pr] = [s1.l.replace(al, ""), s1.r.replace(ar, "")];
  return buildCorrespondence(
    tri1,
    [al, pl, tri1.getThirdPoint(al, pl)],
    tri2,
    [ar, pr, tri2.getThirdPoint(ar, pr)],
  );
};

export const checkSss = (
  t_cong: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  conSeg3: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];

  const s1 = assignToTri(conSeg1.arguments, tri1, tri2, ctx);
  if (!s1.res.ok) return s1.res;
  const s2 = assignToTri(conSeg2.arguments, tri1, tri2, ctx);
  if (!s2.res.ok) return s2.res;
  const s3 = assignToTri(conSeg3.arguments, tri1, tri2, ctx);
  if (!s3.res.ok) return s3.res;

  // The three pairs must cover all three sides of each triangle exactly once.
  // Without this, a side may be cited twice and the remaining side carries no
  // constraint, so the triangles are not shown congruent.
  if (
    !tri1.hasUniqueSegs(s1.l, s2.l, s3.l) ||
    !tri2.hasUniqueSegs(s1.r, s2.r, s3.r)
  ) {
    return reasonApplicationFail(SSS_SEGS_NOT_UNIQUE, {
      tri1: tri1.label,
      tri2: tri2.label,
      segs1: [s1.l, s2.l, s3.l],
      segs2: [s1.r, s2.r, s3.r],
    });
  }

  return buildCorrespondence(
    tri1,
    [commonPt(s1.l, s2.l), commonPt(s2.l, s3.l), commonPt(s3.l, s1.l)],
    tri2,
    [commonPt(s1.r, s2.r), commonPt(s2.r, s3.r), commonPt(s3.r, s1.r)],
  );
};

export const checkAas = (
  t_cong: Stmt,
  conAng1: Stmt,
  conAng2: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];

  const a1 = assignToTri(conAng1.arguments, tri1, tri2, ctx);
  if (!a1.res.ok) return a1.res;
  const a2 = assignToTri(conAng2.arguments, tri1, tri2, ctx);
  if (!a2.res.ok) return a2.res;
  const s = assignToTri(conSeg.arguments, tri1, tri2, ctx);
  if (!s.res.ok) return s.res;

  const [a1l, a1r] = [angCenter(a1.l), angCenter(a1.r)];
  const [a2l, a2r] = [angCenter(a2.l), angCenter(a2.r)];

  const check = (tri: Triangle, a1: string, a2: string, seg: string) => {
    const valid =
      (seg.includes(a1) && !seg.includes(a2)) ||
      (!seg.includes(a1) && seg.includes(a2));
    return valid
      ? reasonApplicationOk()
      : reasonApplicationFail(AAS_BAD, {
          seg,
          a1,
          a2,
          tri: tri.label,
        });
  };

  const checkLeft = check(tri1, a1l, a2l, s.l);
  if (!checkLeft.ok) return checkLeft;
  const checkRight = check(tri2, a1r, a2r, s.r);
  if (!checkRight.ok) return checkRight;

  const distinct = distinctAngs(tri1, a1.l, a2.l, tri2, a1.r, a2.r, ctx);
  if (!distinct.ok) return distinct;

  return buildCorrespondence(
    tri1,
    [a1l, a2l, s.l.replace(a1l, "").replace(a2l, "")],
    tri2,
    [a1r, a2r, s.r.replace(a1r, "").replace(a2r, "")],
  );
};

export const checkAsa = (
  t_cong: Stmt,
  conAng1: Stmt,
  conSeg: Stmt,
  conAng2: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];

  const a1 = assignToTri(conAng1.arguments, tri1, tri2, ctx);
  if (!a1.res.ok) return a1.res;
  const a2 = assignToTri(conAng2.arguments, tri1, tri2, ctx);
  if (!a2.res.ok) return a2.res;
  const s = assignToTri(conSeg.arguments, tri1, tri2, ctx);
  if (!s.res.ok) return s.res;

  const [a1l, a1r] = [angCenter(a1.l), angCenter(a1.r)];
  const [a2l, a2r] = [angCenter(a2.l), angCenter(a2.r)];

  const check = (tri: Triangle, a1: string, s: string, a2: string) => {
    return s.includes(a1) && s.includes(a2)
      ? reasonApplicationOk()
      : reasonApplicationFail(ASA_BAD, {
          seg: s,
          a1,
          a2,
          tri: tri.label,
        });
  };

  const checkLeft = check(tri1, a1l, s.l, a2l);
  if (!checkLeft.ok) return checkLeft;
  const checkRight = check(tri2, a1r, s.r, a2r); // check right
  if (!checkRight.ok) return checkRight;

  const distinct = distinctAngs(tri1, a1.l, a2.l, tri2, a1.r, a2.r, ctx);
  if (!distinct.ok) return distinct;

  return buildCorrespondence(
    tri1,
    [a1l, a2l, tri1.getThirdPoint(a1l, a2l)],
    tri2,
    [a1r, a2r, tri2.getThirdPoint(a1r, a2r)],
  );
};

export const checkRhl = (
  t_cong: Stmt,
  rightCon: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];

  const r = assignToTri(rightCon.arguments, tri1, tri2, ctx);
  if (!r.res.ok) return r.res;
  const h = assignToTri(conSeg1.arguments, tri1, tri2, ctx);
  if (!h.res.ok) return h.res;
  const l = assignToTri(conSeg2.arguments, tri1, tri2, ctx);
  if (!l.res.ok) return l.res;

  const [rl, rr] = [angCenter(r.l), angCenter(r.r)];
  const check = (tri: Triangle, r: string, h: string, l: string) => {
    return l.includes(r) && !h.includes(r)
      ? reasonApplicationOk()
      : reasonApplicationFail(RHL_BAD, {
          r,
          h,
          l,
          tri: tri.label,
        });
  };

  const checkLeft = check(tri1, rl, h.l, l.l);
  if (!checkLeft.ok) return checkLeft;
  const checkRight = check(tri2, rr, h.r, l.r); // check right
  if (!checkRight.ok) return checkRight;

  const distinct = distinctSegs(tri1, h.l, l.l, tri2, h.r, l.r, ctx);
  if (!distinct.ok) return distinct;

  const [p2l, p2r] = [l.l.replace(rl, ""), l.r.replace(rr, "")];
  return buildCorrespondence(
    tri1,
    [rl, p2l, tri1.getThirdPoint(rl, p2l)],
    tri2,
    [rr, p2r, tri2.getThirdPoint(rr, p2r)],
  );
};

/**
 * Validates CPCTC against the correspondence its cited `con_tri` step recorded.
 *
 * The pairing comes from that one step, never from the vertex order stored on
 * the `Triangle` objects. A later step may relate one of these triangles to a
 * third under a different pairing, and that must not change this result.
 */
export const checkCpctc = (
  t_cong: Stmt,
  correspondence: TriCorrespondence | undefined,
  conclusion: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];
  if (!correspondence) {
    return reasonApplicationFail(NO_CORRESPONDENCE, {
      tri1: tri1.label,
      tri2: tri2.label,
    });
  }
  const map = vertexMap(correspondence, tri1, tri2);
  if (!map) {
    return reasonApplicationFail(CORRESP_TRI_MISMATCH, {
      tri1: tri1.label,
      tri2: tri2.label,
      correspondence: correspondence.tris,
    });
  }

  const pair = assignToTri(conclusion.arguments, tri1, tri2, ctx);
  if (!pair.res.ok) return pair.res;

  if (conclusion.function === "con_seg") {
    const left = triSegPts(tri1, pair.l);
    const right = triSegPts(tri2, pair.r);
    const expected = left && left.map((p) => map.get(p));
    const corresponds =
      !!right &&
      !!expected &&
      expected.every((p) => !!p) &&
      new Set(expected).size === 2 &&
      right.every((p) => expected.includes(p));
    if (!corresponds) {
      return reasonApplicationFail(SEG_NOT_CORRESP, {
        seg1: pair.l,
        seg2: pair.r,
        expected: expected?.join("") ?? null,
      });
    }
    return reasonApplicationOk();
  }
  if (conclusion.function === "con_ang") {
    const left = triAngPts(tri1, pair.l);
    const right = triAngPts(tri2, pair.r);
    // Corresponding angles share a mapped vertex and mapped rays; the two ray
    // endpoints are unordered because `a_XYZ` and `a_ZYX` name one angle.
    const corresponds =
      !!left &&
      !!right &&
      map.get(left[1]) === right[1] &&
      [map.get(left[0]), map.get(left[2])].every(
        (p) => !!p && (p === right[0] || p === right[2]),
      ) &&
      map.get(left[0]) !== map.get(left[2]);
    if (!corresponds) {
      return reasonApplicationFail(ANG_NOT_CORRESP, {
        ang1: pair.l,
        ang2: pair.r,
      });
    }
    return reasonApplicationOk();
  }
  return reasonApplicationFail(BAD_CONC_TYPE, {
    function: conclusion.function,
  });
};

/**
 * Reads the correspondence a `con_tri_ordered` premise states.
 *
 * The premise form carries its pairing in the vertex order the author wrote,
 * so `con_tri_ordered(t_ABC, t_DEF)` pairs A with D, B with E, and C with F.
 * Ordinary `con_tri` has no such guarantee, which is why premises use this
 * form instead.
 */
export const conTriOrdered = (stmt: Stmt, ctx: ProofContent): CheckerResult => {
  const [tri1, tri2] = stmtMapper(stmt, ctx) as [Triangle, Triangle];
  const [w1, w2] = stmt.arguments.map((a) => a.v.replace("t_", "").split(""));
  if (w1.length !== 3 || w2.length !== 3) {
    return reasonApplicationFail(BAD_VERTEX_ORDER, {
      tri1: tri1.label,
      tri2: tri2.label,
    });
  }
  return buildCorrespondence(
    tri1,
    w1 as [string, string, string],
    tri2,
    w2 as [string, string, string],
  );
};

/**
 * Composes the correspondences of two `con_tri` steps that share a triangle.
 *
 * `con_tri_transitive` concludes a pairing, so it must derive that pairing from
 * its dependencies rather than assert only that a shared triangle exists.
 */
export const checkConTriTransitive = (
  dep1: Stmt,
  c1: TriCorrespondence | undefined,
  dep2: Stmt,
  c2: TriCorrespondence | undefined,
  conclusion: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const d1 = stmtMapper(dep1, ctx) as [Triangle, Triangle];
  const d2 = stmtMapper(dep2, ctx) as [Triangle, Triangle];
  const [ca, cb] = stmtMapper(conclusion, ctx) as [Triangle, Triangle];

  const shared = d1.find((x) => d2.some((y) => y.equals(x)));
  const left = shared && d1.find((x) => !x.equals(shared));
  const right = shared && d2.find((x) => !x.equals(shared));
  if (!shared || !left || !right) {
    return reasonApplicationFail("no_shared_congruent_element");
  }
  const concludesPair =
    (left.equals(ca) && right.equals(cb)) ||
    (left.equals(cb) && right.equals(ca));
  if (!concludesPair) {
    return reasonApplicationFail("no_shared_congruent_element");
  }

  if (!c1 || !c2) {
    return reasonApplicationFail(NO_CORRESPONDENCE, {
      tri1: left.label,
      tri2: right.label,
    });
  }
  const toShared = vertexMap(c1, left, shared);
  const fromShared = vertexMap(c2, shared, right);
  if (!toShared || !fromShared) {
    return reasonApplicationFail(CORRESP_TRI_MISMATCH, {
      tri1: left.label,
      tri2: right.label,
      shared: shared.label,
    });
  }

  const leftPts = left.p.map((pt) => pt.label) as [string, string, string];
  const composed = leftPts.map((p) => fromShared.get(toShared.get(p) ?? ""));
  if (composed.some((p) => !p) || new Set(composed).size !== 3) {
    return reasonApplicationFail(CORRESP_TRI_MISMATCH, {
      tri1: left.label,
      tri2: right.label,
      shared: shared.label,
    });
  }
  return buildCorrespondence(
    left,
    leftPts,
    right,
    composed as [string, string, string],
  );
};

export const checkConTri = (
  t_cong: Stmt,
  cs1: Stmt,
  cs2: Stmt,
  cs3: Stmt,
  ca1: Stmt,
  ca2: Stmt,
  ca3: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];

  const assign = (stmt: Stmt) => assignToTri(stmt.arguments, tri1, tri2, ctx);
  const s1 = assign(cs1);
  if (!s1.res.ok) return s1.res;
  const s2 = assign(cs2);
  if (!s2.res.ok) return s2.res;
  const s3 = assign(cs3);
  if (!s3.res.ok) return s3.res;
  const a1 = assign(ca1);
  if (!a1.res.ok) return a1.res;
  const a2 = assign(ca2);
  if (!a2.res.ok) return a2.res;
  const a3 = assign(ca3);
  if (!a3.res.ok) return a3.res;

  const valid =
    tri1.hasUniqueSegs(s1.l, s2.l, s3.l) &&
    tri2.hasUniqueSegs(s1.r, s2.r, s3.r) &&
    tri1.hasUniqueAngs(a1.l, a2.l, a3.l) &&
    tri2.hasUniqueAngs(a1.r, a2.r, a3.r);

  if (!valid) {
    return reasonApplicationFail(NOT_UNIQUE_DIST, {
      tri1: tri1.label,
      tri2: tri2.label,
      segs1: [s1.l, s2.l, s3.l],
      segs2: [s1.r, s2.r, s3.r],
      angs1: [a1.l, a2.l, a3.l],
      angs2: [a1.r, a2.r, a3.r],
    });
  }
  // The three angle pairs cover each triangle exactly once, so their centers
  // give the vertex pairing directly.
  return buildCorrespondence(
    tri1,
    [angCenter(a1.l), angCenter(a2.l), angCenter(a3.l)],
    tri2,
    [angCenter(a1.r), angCenter(a2.r), angCenter(a3.r)],
  );
};

export const checkThirdAngle = (
  conAng1: Stmt,
  conAng2: Stmt,
  conAng3: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  // need to find t1 and t2 from ctx. try 2 possible arrangements and fail otherwise.
  const [a11, a12] = stmtMapper(conAng1, ctx) as [Angle, Angle];
  const [a21, a22] = stmtMapper(conAng2, ctx) as [Angle, Angle];
  const t1 =
    getTriFromAngs(a11, a21, ctx) ?? getTriFromAngs(a11, a22, ctx) ?? null;
  const t2 =
    getTriFromAngs(a12, a22, ctx) ?? getTriFromAngs(a21, a12, ctx) ?? null;
  if (!t1 || !t2 || t1.equals(t2)) {
    return reasonApplicationFail(TRI_NOT_FOUND, {
      angs1: [a11.label, a12.label],
      angs2: [a21.label, a22.label],
    });
  }

  // check all angles are either in t1 or t2
  const a1 = assignToTri(conAng1.arguments, t1, t2, ctx);
  if (!a1.res.ok) return a1.res;
  const a2 = assignToTri(conAng2.arguments, t1, t2, ctx);
  if (!a2.res.ok) return a2.res;
  const a3 = assignToTri(conAng3.arguments, t1, t2, ctx);
  if (!a3.res.ok) return a3.res;

  // The three angle pairs must cover each triangle's angles exactly once.
  if (
    t1.hasUniqueAngs(a1.l, a2.l, a3.l) &&
    t2.hasUniqueAngs(a1.r, a2.r, a3.r)
  ) {
    return reasonApplicationOk();
  }
  return reasonApplicationFail(ANGS_NOT_UNIQUE, {
    tri1: t1.label,
    tri2: t2.label,
    angs1: [a1.l, a2.l, a3.l],
    angs2: [a1.r, a2.r, a3.r],
  });
};

export const checkIsosceles = (
  conSeg: Stmt,
  isoscelesStmt: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];
  const [t] = stmtMapper(isoscelesStmt, ctx) as [Triangle];

  if (!(t.contains(s1) && t.contains(s2) && !s1.equals(s2))) {
    return reasonApplicationFail(NOT_ISOS_SIDES);
  }
  return reasonApplicationOk();
};

export const checkBaseAngle = (
  conSeg: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];
  const t = getTriFromAngs(a1, a2, ctx);
  if (!t) {
    return reasonApplicationFail(TRI_NOT_FOUND, {
      ang1: a1.label,
      ang2: a2.label,
    });
  }
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];
  if (!t.contains(s1) || !t.contains(s2)) {
    return reasonApplicationFail(BASE_ANG_BAD, {
      tri: t.label,
      segs: [s1.label, s2.label],
      angs: [a1.label, a2.label],
    });
  }
  // Each angle's center (base vertex) must appear in exactly one of the
  // congruent segments: s1 connects the apex to one base vertex, s2 to the other.
  // If a center appears in both segments it is the apex angle, not a base angle.
  const a1c = a1.center.label;
  const a2c = a2.center.label;
  const validPattern =
    (s1.label.includes(a1c) &&
      !s2.label.includes(a1c) &&
      s2.label.includes(a2c) &&
      !s1.label.includes(a2c)) ||
    (s1.label.includes(a2c) &&
      !s2.label.includes(a2c) &&
      s2.label.includes(a1c) &&
      !s1.label.includes(a1c));
  if (!validPattern) {
    return reasonApplicationFail(BASE_ANG_BAD, {
      tri: t.label,
      segs: [s1.label, s2.label],
      angs: [a1.label, a2.label],
    });
  }
  return reasonApplicationOk();
};

export const equilateralEquiangular = (
  t_equil: Stmt,
  t_equiang: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [t1] = stmtMapper(t_equil, ctx) as [Triangle];
  const [t2] = stmtMapper(t_equiang, ctx) as [Triangle];
  if (t1 && t2 && t1 === t2) {
    return reasonApplicationOk();
  }
  return reasonApplicationFail(DIFF_TRIANGLES, {
    tri1: t1?.label,
    tri2: t2?.label,
  });
};

export const checkEquilateral = (
  cs1: Stmt,
  cs2: Stmt,
  cs3: Stmt,
  equil_t: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [t] = stmtMapper(equil_t, ctx) as [Triangle];
  const [x1, x2] = stmtMapper(cs1, ctx) as [Segment, Segment];
  const [y1, y2] = stmtMapper(cs2, ctx) as [Segment, Segment];
  const [z1, z2] = stmtMapper(cs3, ctx) as [Segment, Segment];
  // make a list of all 6 segments and check that each side of t has 2 collisions
  const segs = [x1, x2, y1, y2, z1, z2];
  const invalidSides = t.s.filter((side) => {
    const collisions = segs.filter((s) => t.contains(s) && s.equals(side));
    return collisions.length !== 2;
  });
  if (invalidSides.length > 0) {
    return reasonApplicationFail(NOT_TWO_SIDES, {
      tri: t.label,
      sides: invalidSides.map((side) => side.label),
    });
  }
  return reasonApplicationOk();
};

export const checkEquiangular = (
  ca1: Stmt,
  ca2: Stmt,
  ca3: Stmt,
  equil_t: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [t] = stmtMapper(equil_t, ctx) as [Triangle];
  const [x1, x2] = stmtMapper(ca1, ctx) as [Angle, Angle];
  const [y1, y2] = stmtMapper(ca2, ctx) as [Angle, Angle];
  const [z1, z2] = stmtMapper(ca3, ctx) as [Angle, Angle];
  // make a list of all 6 angles and check that each angle of t has 2 collisions
  const angs = [x1, x2, y1, y2, z1, z2];
  const invalidAngles = t.a.filter((angle) => {
    const collisions = angs.filter((a) => t.contains(a) && a.equals(angle));
    return collisions.length !== 2;
  });
  if (invalidAngles.length > 0) {
    return reasonApplicationFail(NOT_TWO_ANGS, {
      tri: t.label,
      angles: invalidAngles.map((angle) => angle.label),
    });
  }
  return reasonApplicationOk();
};

export const checkAa = (
  t_sim: Stmt,
  conAng1: Stmt,
  conAng2: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_sim, ctx) as [Triangle, Triangle];

  const a1 = assignToTri(conAng1.arguments, tri1, tri2, ctx);
  if (!a1.res.ok)
    return reasonApplicationFail(a1.res.failure.code, a1.res.failure.details);
  const a2 = assignToTri(conAng2.arguments, tri1, tri2, ctx);
  if (!a2.res.ok)
    return reasonApplicationFail(a2.res.failure.code, a2.res.failure.details);

  // `sim_tri` carries a correspondence too, but no reason consumes one yet:
  // `cstp` and `sim_seg` have no case in `reasonApplication` and fall through
  // to its permissive default. Record one here when they gain a check.
  return reasonApplicationOk();
};
