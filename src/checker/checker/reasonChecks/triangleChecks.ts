import {
  Obj,
  ParseObj,
  ProofContent,
  Triangle,
} from "../../../geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper, conTriMapper } from "./argMappers";
import {
  reasonApplicationFail,
  ReasonApplicationFailure,
  reasonApplicationOk,
  ReasonApplicationResult,
} from "./triangleReasonResult";
import {
  angCenter,
  checkDistinctDependencyStmts,
  commonPt,
  getTriFromAngs,
} from "./utils";

type TriangleAssignResult =
  | { ok: true; left: string; right: string }
  | { ok: false; failure: ReasonApplicationFailure };

// Returns the ParseObj form that the triangle actually recognises, resolving
// through angle overlap names in ctx when the raw label isn't in the triangle.
const resolveForTri = (
  obj: ParseObj,
  tri: Triangle,
  ctx: ProofContent,
): ParseObj | null => {
  if (tri.containsParseObj(obj)) return obj;
  if (obj.type === Obj.Angle) {
    const resolved = ctx
      .getAngle(obj.v)
      ?.resolveLabel((name) => tri.containsParseObj({ ...obj, v: name }));
    if (resolved) return { ...obj, v: resolved };
  }
  return null;
};

const sortPairToTri = (
  pair: ParseObj[],
  [tri1, tri2]: [Triangle, Triangle],
  ctx: ProofContent,
):
  | { ok: true; left: ParseObj; right: ParseObj }
  | { ok: false; failure: ReasonApplicationFailure } => {
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
      code: "TRI_ASSIGN_SORT",
      details: { left: l.v, right: r.v, tri1: tri1.label, tri2: tri2.label },
    },
  };
};

const checkTriangleAssign = (
  pair: ParseObj[],
  tri1: Triangle,
  tri2: Triangle,
  ctx: ProofContent,
): TriangleAssignResult => {
  const sorted = sortPairToTri(pair, [tri1, tri2], ctx);
  if (!sorted.ok) {
    return sorted;
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
      ok: false,
      failure: {
        code: "TRI_ASSIGN_CONTAINMENT",
        details: { left: left.v, right: right.v },
      },
    };
  }
  return { ok: true, left: left.v, right: right.v };
};

const sasSideAnglePattern = (
  segLeft1: string,
  segLeft2: string,
  angleCenter: string,
): boolean => {
  return segLeft1.includes(angleCenter) && segLeft2.includes(angleCenter);
};

/** Validates SAS and updates triangle vertex order in `ctx` when valid. */
export const checkSas = (
  conTri: Stmt,
  conSeg1: Stmt,
  conAng: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conSeg1, conAng, conSeg2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(conTri, ctx);

  const a1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2, ctx);
  if (!a1.ok) return reasonApplicationFail(a1.failure.code, a1.failure.details);
  const a2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2, ctx);
  if (!a2.ok) return reasonApplicationFail(a2.failure.code, a2.failure.details);
  const ang = checkTriangleAssign(conAng.arguments, tri1, tri2, ctx);
  if (!ang.ok)
    return reasonApplicationFail(ang.failure.code, ang.failure.details);

  const s11 = a1.left;
  const s21 = a1.right;
  const s12 = a2.left;
  const s22 = a2.right;
  const center1 = angCenter(ang.left);
  const center2 = angCenter(ang.right);

  const triangle1SAS = sasSideAnglePattern(s11, s12, center1);
  const triangle2SAS = sasSideAnglePattern(s21, s22, center2);

  if (!(triangle1SAS && triangle2SAS)) {
    return reasonApplicationFail("SAS_PATTERN", {
      center1,
      center2,
      triangle1SAS,
      triangle2SAS,
    });
  }

  const t1cp2 = s11.replace(center1, "");
  const t1p3 = tri1.getThirdPoint(center1, t1cp2);

  const t2p2 = s21.replace(center2, "");
  const t2p3 = tri2.getThirdPoint(center2, t2p2);

  tri1.orderTri([center1, t1cp2, t1p3], ctx);
  tri2.orderTri([center2, t2p2, t2p3], ctx);

  return reasonApplicationOk();
};

export const checkSss = (
  t_cong: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  conSeg3: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conSeg1, conSeg2, conSeg3]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  const r1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2, ctx);
  if (!r1.ok) return reasonApplicationFail(r1.failure.code, r1.failure.details);
  const r2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2, ctx);
  if (!r2.ok) return reasonApplicationFail(r2.failure.code, r2.failure.details);
  const r3 = checkTriangleAssign(conSeg3.arguments, tri1, tri2, ctx);
  if (!r3.ok) return reasonApplicationFail(r3.failure.code, r3.failure.details);

  const s11 = r1.left;
  const s21 = r1.right;
  const s12 = r2.left;
  const s22 = r2.right;
  const s13 = r3.left;
  const s23 = r3.right;

  tri1.orderTri(
    [commonPt(s11, s12), commonPt(s12, s13), commonPt(s13, s11)],
    ctx,
  );
  tri2.orderTri(
    [commonPt(s21, s22), commonPt(s22, s23), commonPt(s23, s21)],
    ctx,
  );

  return reasonApplicationOk();
};

const aasSideTouchesOneAngleEach = (
  segLeft: string,
  c1: string,
  c2: string,
): boolean => {
  return (
    (segLeft.includes(c1) && !segLeft.includes(c2)) ||
    (!segLeft.includes(c1) && segLeft.includes(c2))
  );
};

export const checkAas = (
  t_cong: Stmt,
  conAng1: Stmt,
  conAng2: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conAng1, conAng2, conSeg]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  const e1 = checkTriangleAssign(conAng1.arguments, tri1, tri2, ctx);
  if (!e1.ok) return reasonApplicationFail(e1.failure.code, e1.failure.details);
  const e2 = checkTriangleAssign(conAng2.arguments, tri1, tri2, ctx);
  if (!e2.ok) return reasonApplicationFail(e2.failure.code, e2.failure.details);
  const es = checkTriangleAssign(conSeg.arguments, tri1, tri2, ctx);
  if (!es.ok) return reasonApplicationFail(es.failure.code, es.failure.details);

  const a11 = e1.left;
  const a21 = e1.right;
  const a12 = e2.left;
  const a22 = e2.right;
  const s1 = es.left;
  const s2 = es.right;

  const a11c = angCenter(a11);
  const a12c = angCenter(a12);
  const a21c = angCenter(a21);
  const a22c = angCenter(a22);

  const t1Valid = aasSideTouchesOneAngleEach(s1, a11c, a12c);
  const t2Valid = aasSideTouchesOneAngleEach(s2, a21c, a22c);

  if (!(t1Valid && t2Valid)) {
    return reasonApplicationFail("AAS_PATTERN", { t1Valid, t2Valid });
  }

  tri1.orderTri([a11c, a12c, s1.replace(a11c, "").replace(a12c, "")], ctx);
  tri2.orderTri([a21c, a22c, s2.replace(a21c, "").replace(a22c, "")], ctx);

  return reasonApplicationOk();
};

export const checkAsa = (
  t_cong: Stmt,
  conAng1: Stmt,
  conSeg: Stmt,
  conAng2: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conAng1, conSeg, conAng2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  const e1 = checkTriangleAssign(conAng1.arguments, tri1, tri2, ctx);
  if (!e1.ok) return reasonApplicationFail(e1.failure.code, e1.failure.details);
  const e2 = checkTriangleAssign(conAng2.arguments, tri1, tri2, ctx);
  if (!e2.ok) return reasonApplicationFail(e2.failure.code, e2.failure.details);
  const es = checkTriangleAssign(conSeg.arguments, tri1, tri2, ctx);
  if (!es.ok) return reasonApplicationFail(es.failure.code, es.failure.details);

  const a11 = e1.left;
  const a21 = e1.right;
  const a12 = e2.left;
  const a22 = e2.right;
  const s1 = es.left;
  const s2 = es.right;

  const a11c = angCenter(a11);
  const a12c = angCenter(a12);
  const a21c = angCenter(a21);
  const a22c = angCenter(a22);

  const t1Valid = s1.includes(a11c) && s1.includes(a12c);
  const t2Valid = s2.includes(a21c) && s2.includes(a22c);

  if (!(t1Valid && t2Valid)) {
    return reasonApplicationFail("ASA_PATTERN", { t1Valid, t2Valid });
  }

  tri1.orderTri([a11c, a12c, tri1.getThirdPoint(a11c, a12c)], ctx);
  tri2.orderTri([a21c, a22c, tri2.getThirdPoint(a21c, a22c)], ctx);

  return reasonApplicationOk();
};

export const checkRhl = (
  t_cong: Stmt,
  rightCon: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([rightCon, conSeg1, conSeg2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  const er = checkTriangleAssign(rightCon.arguments, tri1, tri2, ctx);
  if (!er.ok) return reasonApplicationFail(er.failure.code, er.failure.details);
  const h1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2, ctx);
  if (!h1.ok) return reasonApplicationFail(h1.failure.code, h1.failure.details);
  const h2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2, ctx);
  if (!h2.ok) return reasonApplicationFail(h2.failure.code, h2.failure.details);

  const r1 = er.left;
  const r2 = er.right;
  const s11 = h1.left;
  const s12 = h1.right;
  const s21 = h2.left;
  const s22 = h2.right;

  const r1c = angCenter(r1);
  const r2c = angCenter(r2);

  /** Reason args: hypotenuses first, congruent legs second (see `grammar/defs/reasons`). */
  const hypoValid = !s11.includes(r1c) && !s12.includes(r2c);
  const legValid = s21.includes(r1c) && s22.includes(r2c);

  if (!(hypoValid && legValid)) {
    return reasonApplicationFail("RHL_PATTERN", {
      hypoValid,
      legValid,
      r1c,
      r2c,
    });
  }

  // After RHL validation, the leg contains the right vertex; the other endpoint
  // is the corresponding vertex adjacent to the right angle.
  const t1c2 = s21.replace(r1c, "");
  const t2c2 = s22.replace(r2c, "");

  tri1.orderTri([r1c, t1c2, tri1.getThirdPoint(r1c, t1c2)], ctx);
  tri2.orderTri([r2c, t2c2, tri2.getThirdPoint(r2c, t2c2)], ctx);

  return reasonApplicationOk();
};

const checkCpctcSegment = (
  tri1: Triangle,
  tri2: Triangle,
  conclusion: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const assign = checkTriangleAssign(conclusion.arguments, tri1, tri2, ctx);
  if (!assign.ok) {
    return reasonApplicationFail(assign.failure.code, assign.failure.details);
  }
  if (
    tri1.getSegmentIndex(assign.left) !== tri2.getSegmentIndex(assign.right)
  ) {
    return reasonApplicationFail("CPCTC_SEG_INDEX", {
      // segments are not corresponding
      seg1: assign.left,
      seg2: assign.right,
    });
  }
  return reasonApplicationOk();
};

const checkCpctcAngle = (
  tri1: Triangle,
  tri2: Triangle,
  conclusion: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const assign = checkTriangleAssign(conclusion.arguments, tri1, tri2, ctx);
  if (!assign.ok) {
    return reasonApplicationFail(assign.failure.code, assign.failure.details);
  }
  if (tri1.getAngleIndex(assign.left) !== tri2.getAngleIndex(assign.right)) {
    return reasonApplicationFail("CPCTC_ANG_INDEX", {
      // angles are not corresponding
      ang1: assign.left,
      ang2: assign.right,
    });
  }
  return reasonApplicationOk();
};

export const checkCpctc = (
  t_cong: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  if (conclusion.function === "con_seg") {
    return checkCpctcSegment(tri1, tri2, conclusion, ctx);
  }
  if (conclusion.function === "con_ang") {
    return checkCpctcAngle(tri1, tri2, conclusion, ctx);
  }
  return reasonApplicationFail("CPCTC_CONCLUSION", {
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
): ReasonApplicationResult => {
  const dupSegs = checkDistinctDependencyStmts([cs1, cs2, cs3]);
  if (!dupSegs.ok) return dupSegs;
  const dupAngs = checkDistinctDependencyStmts([ca1, ca2, ca3]);
  if (!dupAngs.ok) return dupAngs;

  const [tri1, tri2] = conTriMapper(t_cong, ctx);

  const assign = (stmt: Stmt) =>
    checkTriangleAssign(stmt.arguments, tri1, tri2, ctx);
  const s1 = assign(cs1);
  if (!s1.ok) return reasonApplicationFail(s1.failure.code, s1.failure.details);
  const s2 = assign(cs2);
  if (!s2.ok) return reasonApplicationFail(s2.failure.code, s2.failure.details);
  const s3 = assign(cs3);
  if (!s3.ok) return reasonApplicationFail(s3.failure.code, s3.failure.details);
  const a1 = assign(ca1);
  if (!a1.ok) return reasonApplicationFail(a1.failure.code, a1.failure.details);
  const a2 = assign(ca2);
  if (!a2.ok) return reasonApplicationFail(a2.failure.code, a2.failure.details);
  const a3 = assign(ca3);
  if (!a3.ok) return reasonApplicationFail(a3.failure.code, a3.failure.details);

  const valid =
    tri1.hasUniqueSegs(s1.left, s2.left, s3.left) &&
    tri2.hasUniqueSegs(s1.right, s2.right, s3.right) &&
    tri1.hasUniqueAngs(a1.left, a2.left, a3.left) &&
    tri2.hasUniqueAngs(a1.right, a2.right, a3.right);

  if (!valid) {
    return reasonApplicationFail("DEF_CON_TRI_PATTERN", {
      tri1: tri1.label,
      tri2: tri2.label,
      segs1: [s1.left, s2.left, s3.left],
      segs2: [s1.right, s2.right, s3.right],
      angs1: [a1.left, a2.left, a3.left],
      angs2: [a1.right, a2.right, a3.right],
    });
  }
  return reasonApplicationOk();
};

export const checkThirdAngle = (
  conAng1: Stmt,
  conAng2: Stmt,
  conAng3: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conAng1, conAng2, conAng3]);
  if (!dup.ok) return dup;
  // need to find t1 and t2 from ctx. try 2 possible arrangements and fail otherwise.
  const [a11, a12] = conAngMapper(conAng1, ctx);
  const [a21, a22] = conAngMapper(conAng2, ctx);
  const t1 =
    getTriFromAngs(a11, a21, ctx) ?? getTriFromAngs(a11, a22, ctx) ?? null;
  const t2 =
    getTriFromAngs(a12, a22, ctx) ?? getTriFromAngs(a21, a12, ctx) ?? null;
  if (!t1 || !t2 || t1.isEqualTo(t2)) {
    return reasonApplicationFail("THIRD_ANGLE_TRIANGLE_NOT_FOUND", {
      angs1: [a11.label, a12.label],
      angs2: [a21.label, a22.label],
    });
  }

  // check all angles are either in t1 or t2
  const a1 = checkTriangleAssign(conAng1.arguments, t1, t2, ctx);
  if (!a1.ok) return reasonApplicationFail(a1.failure.code, a1.failure.details);
  const a2 = checkTriangleAssign(conAng2.arguments, t1, t2, ctx);
  if (!a2.ok) return reasonApplicationFail(a2.failure.code, a2.failure.details);
  const a3 = checkTriangleAssign(conAng3.arguments, t1, t2, ctx);
  if (!a3.ok) return reasonApplicationFail(a3.failure.code, a3.failure.details);

  // order the triangles if t1 and t2 each contain exactly 3 unique angles
  if (
    t1.hasUniqueAngs(a1.left, a2.left, a3.left) &&
    t2.hasUniqueAngs(a1.right, a2.right, a3.right)
  ) {
    t1.orderTri(
      [angCenter(a1.left), angCenter(a2.left), angCenter(a3.left)],
      ctx,
    );
    t2.orderTri(
      [angCenter(a1.right), angCenter(a2.right), angCenter(a3.right)],
      ctx,
    );
    return reasonApplicationOk();
  }
  return reasonApplicationFail("THIRD_ANGLE_PATTERN", {
    tri1: t1.label,
    tri2: t2.label,
    angs1: [a1.left, a2.left, a3.left],
    angs2: [a1.right, a2.right, a3.right],
  });
};

export const checkIsosceles = (
  conSeg: Stmt,
  isoscelesStmt: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [s1, s2] = conSegMapper(conSeg, ctx);
  const [t] = conTriMapper(isoscelesStmt, ctx);

  if (!(t.contains(s1) && t.contains(s2) && !s1.equals(s2))) {
    return reasonApplicationFail("ISOSCELES_PATTERN");
  }
  return reasonApplicationOk();
};

export const checkBaseAngle = (
  conSeg: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
): ReasonApplicationResult => {
  const [a1, a2] = conAngMapper(conAng, ctx);
  if (a1.equals(a2)) {
    return reasonApplicationFail("BASE_ANGLE_SAME_ANGLE", {
      ang: a1.label,
    });
  }
  const t = getTriFromAngs(a1, a2, ctx);
  if (!t) {
    return reasonApplicationFail("BASE_ANGLE_TRIANGLE_NOT_FOUND", {
      ang1: a1.label,
      ang2: a2.label,
    });
  }
  const [s1, s2] = conSegMapper(conSeg, ctx);
  if (!t.contains(s1) || !t.contains(s2) || s1.equals(s2)) {
    return reasonApplicationFail("BASE_ANGLE_PATTERN", {
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
    return reasonApplicationFail("BASE_ANGLE_PATTERN", {
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
): ReasonApplicationResult => {
  const [t1] = conTriMapper(t_equil, ctx);
  const [t2] = conTriMapper(t_equiang, ctx);
  if (t1 && t2 && t1 === t2) {
    return reasonApplicationOk();
  }
  return reasonApplicationFail("EQUIL_EQUIANG_SAME_TRIANGLE", {
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
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([cs1, cs2, cs3]);
  if (!dup.ok) return dup;
  const [t] = conTriMapper(equil_t, ctx);
  const [x1, x2] = conSegMapper(cs1, ctx);
  const [y1, y2] = conSegMapper(cs2, ctx);
  const [z1, z2] = conSegMapper(cs3, ctx);
  if (x1.equals(x2) || y1.equals(y2) || z1.equals(z2)) {
    return reasonApplicationFail("EQUILATERAL_SAME_SEG", {
      seg1: x1.equals(x2) ? x1.label : y1.equals(y2) ? y1.label : z1.label,
    });
  }
  // make a list of all 6 segments and check that each side of t has 2 collisions
  const segs = [x1, x2, y1, y2, z1, z2];
  const invalidSides = t.s.filter((side) => {
    const collisions = segs.filter((s) => t.contains(s) && s.equals(side));
    return collisions.length !== 2;
  });
  if (invalidSides.length > 0) {
    return reasonApplicationFail("EQUILATERAL_SIDES_WITH_NOT_TWO_COLLISIONS", {
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
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([ca1, ca2, ca3]);
  if (!dup.ok) return dup;
  const [t] = conTriMapper(equil_t, ctx);
  const [x1, x2] = conAngMapper(ca1, ctx);
  const [y1, y2] = conAngMapper(ca2, ctx);
  const [z1, z2] = conAngMapper(ca3, ctx);
  if (x1.equals(x2) || y1.equals(y2) || z1.equals(z2)) {
    return reasonApplicationFail("EQUIANGULAR_SAME_ANG", {
      ang1: x1.equals(x2) ? x1.label : y1.equals(y2) ? y1.label : z1.label,
    });
  }
  // make a list of all 6 angles and check that each angle of t has 2 collisions
  const angs = [x1, x2, y1, y2, z1, z2];
  const invalidAngles = t.a.filter((angle) => {
    const collisions = angs.filter((a) => t.contains(a) && a.equals(angle));
    return collisions.length !== 2;
  });
  if (invalidAngles.length > 0) {
    return reasonApplicationFail("EQUIANGULAR_ANGLES_WITH_NOT_TWO_COLLISIONS", {
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
): ReasonApplicationResult => {
  const dup = checkDistinctDependencyStmts([conAng1, conAng2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = conTriMapper(t_sim, ctx);

  const e1 = checkTriangleAssign(conAng1.arguments, tri1, tri2, ctx);
  if (!e1.ok) return reasonApplicationFail(e1.failure.code, e1.failure.details);
  const e2 = checkTriangleAssign(conAng2.arguments, tri1, tri2, ctx);
  if (!e2.ok) return reasonApplicationFail(e2.failure.code, e2.failure.details);

  const a11c = angCenter(e1.left);
  const a12c = angCenter(e2.left);
  const a21c = angCenter(e1.right);
  const a22c = angCenter(e2.right);

  tri1.orderTri([a11c, a12c, tri1.getThirdPoint(a11c, a12c)], ctx);
  tri2.orderTri([a21c, a22c, tri2.getThirdPoint(a21c, a22c)], ctx);

  return reasonApplicationOk();
};
