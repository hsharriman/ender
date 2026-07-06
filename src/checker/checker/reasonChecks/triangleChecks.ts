import { ErrorType } from "checker/errors/errorConstants";
import {
  Angle,
  Obj,
  ParseObj,
  ProofContent,
  Segment,
  Triangle,
} from "../../../geometry-object";
import { Stmt } from "../../types/checkerTypes";
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

type TriangleAssignResult = { ok: true; left: string; right: string };

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

  const [pl, pr] = [s1.l.replace(al, ""), s1.r.replace(ar, "")];
  tri1.orderTri([al, pl, tri1.getThirdPoint(al, pl)], ctx);
  tri2.orderTri([ar, pr, tri2.getThirdPoint(ar, pr)], ctx);
  return reasonApplicationOk();
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

  tri1.orderTri(
    [commonPt(s1.l, s2.l), commonPt(s2.l, s3.l), commonPt(s3.l, s1.l)],
    ctx,
  );
  tri2.orderTri(
    [commonPt(s1.r, s2.r), commonPt(s2.r, s3.r), commonPt(s3.r, s1.r)],
    ctx,
  );

  return reasonApplicationOk();
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

  tri1.orderTri([a1l, a2l, s.l.replace(a1l, "").replace(a2l, "")], ctx);
  tri2.orderTri([a1r, a2r, s.r.replace(a1r, "").replace(a2r, "")], ctx);
  return reasonApplicationOk();
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

  tri1.orderTri([a1l, a2l, tri1.getThirdPoint(a1l, a2l)], ctx);
  tri2.orderTri([a1r, a2r, tri2.getThirdPoint(a1r, a2r)], ctx);

  return reasonApplicationOk();
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

  const [p2l, p2r] = [l.l.replace(rl, ""), l.r.replace(rr, "")];
  tri1.orderTri([rl, p2l, tri1.getThirdPoint(rl, p2l)], ctx);
  tri2.orderTri([rr, p2r, tri2.getThirdPoint(rr, p2r)], ctx);
  return reasonApplicationOk();
};

export const checkCpctc = (
  t_cong: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const [tri1, tri2] = stmtMapper(t_cong, ctx) as [Triangle, Triangle];
  const pair = assignToTri(conclusion.arguments, tri1, tri2, ctx);
  if (!pair.res.ok) return pair.res;

  if (conclusion.function === "con_seg") {
    if (tri1.getSegmentIndex(pair.l) !== tri2.getSegmentIndex(pair.r)) {
      return reasonApplicationFail(SEG_NOT_CORRESP, {
        seg1: pair.l,
        seg2: pair.r,
      });
    }
    return reasonApplicationOk();
  }
  if (conclusion.function === "con_ang") {
    if (tri1.getAngleIndex(pair.l) !== tri2.getAngleIndex(pair.r)) {
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
  return reasonApplicationOk();
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

  // order the triangles if t1 and t2 each contain exactly 3 unique angles
  if (
    t1.hasUniqueAngs(a1.l, a2.l, a3.l) &&
    t2.hasUniqueAngs(a1.r, a2.r, a3.r)
  ) {
    t1.orderTri([angCenter(a1.l), angCenter(a2.l), angCenter(a3.l)], ctx);
    t2.orderTri([angCenter(a1.r), angCenter(a2.r), angCenter(a3.r)], ctx);
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

  const [a1l, a1r] = [angCenter(a1.l), angCenter(a1.r)];
  const [a2l, a2r] = [angCenter(a2.l), angCenter(a2.r)];

  tri1.orderTri([a1l, a2l, tri1.getThirdPoint(a1l, a2l)], ctx);
  tri2.orderTri([a1r, a2r, tri2.getThirdPoint(a1r, a2r)], ctx);

  return reasonApplicationOk();
};
