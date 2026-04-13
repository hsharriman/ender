import { ParseObj, ProofContent, Triangle } from "../../../geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { conSegMapper, conTriMapper } from "./argMappers";
import {
  triangleFail,
  triangleOk,
  TriangleReasonFailure,
  TriangleReasonResult,
} from "./triangleReasonResult";
import { angCenter, commonPt, findDuplicateDependencyStatements } from "./utils";

type TriangleAssignResult =
  | { ok: true; left: string; right: string }
  | { ok: false; failure: TriangleReasonFailure };

const congruentTrianglePair = (
  conTri: Stmt,
  ctx: ProofContent,
): [Triangle, Triangle] => {
  const tempCtx = new ProofContent(ctx.getCtx());
  return conTriMapper(conTri, tempCtx) as [Triangle, Triangle];
};

const sortPairToTri = (
  pair: ParseObj[],
  [tri1, tri2]: [Triangle, Triangle],
):
  | { ok: true; left: ParseObj; right: ParseObj }
  | { ok: false; failure: TriangleReasonFailure } => {
  const [l, r] = pair;
  if (l.v === r.v || (tri1.containsParseObj(l) && tri2.containsParseObj(r))) {
    return { ok: true, left: l, right: r };
  }
  if (tri1.containsParseObj(r) && tri2.containsParseObj(l)) {
    return { ok: true, left: r, right: l };
  }

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
): TriangleAssignResult => {
  const sorted = sortPairToTri(pair, [tri1, tri2]);
  if (!sorted.ok) {
    return sorted;
  }

  const { left, right } = sorted;
  const obj1_in_t1 = tri1.containsParseObj(left);
  const obj2_in_t2 = tri2.containsParseObj(right);
  const obj1_in_t2 = tri2.containsParseObj(left);
  const obj2_in_t1 = tri1.containsParseObj(right);

  const valid =
    left.v === right.v ||
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

const checkDistinctDependencyStmts = (
  reason: string,
  deps: Stmt[],
): TriangleReasonResult => {
  const dup = findDuplicateDependencyStatements(deps);
  if (dup) {
    return triangleFail("TRI_DUP_DEP_STMT", { reason, ...dup });
  }
  return triangleOk();
};

/** Validates SAS and updates triangle vertex order in `ctx` when valid. */
export const checkSas = (
  conTri: Stmt,
  conSeg1: Stmt,
  conAng: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const dup = checkDistinctDependencyStmts("sas", [conSeg1, conAng, conSeg2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = congruentTrianglePair(conTri, ctx);

  const a1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2);
  if (!a1.ok) return triangleFail(a1.failure.code, a1.failure.details);
  const a2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2);
  if (!a2.ok) return triangleFail(a2.failure.code, a2.failure.details);
  const ang = checkTriangleAssign(conAng.arguments, tri1, tri2);
  if (!ang.ok) return triangleFail(ang.failure.code, ang.failure.details);

  const s11 = a1.left;
  const s21 = a1.right;
  const s12 = a2.left;
  const s22 = a2.right;
  const center1 = angCenter(ang.left);
  const center2 = angCenter(ang.right);

  const triangle1SAS = sasSideAnglePattern(s11, s12, center1);
  const triangle2SAS = sasSideAnglePattern(s21, s22, center2);

  if (!(triangle1SAS && triangle2SAS)) {
    return triangleFail("SAS_PATTERN", {
      center1,
      center2,
      triangle1SAS,
      triangle2SAS,
    });
  }

  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);

  const t1cp2 = s11.replace(center1, "");
  const t1p3 = t1.getThirdPoint(center1, t1cp2);

  const t2p2 = s21.replace(center2, "");
  const t2p3 = t2.getThirdPoint(center2, t2p2);

  t1.orderTriangle([center1, t1cp2, t1p3], ctx);
  t2.orderTriangle([center2, t2p2, t2p3], ctx);

  return triangleOk();
};

export const checkSss = (
  t_cong: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  conSeg3: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const dup = checkDistinctDependencyStmts("sss", [conSeg1, conSeg2, conSeg3]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = congruentTrianglePair(t_cong, ctx);

  const r1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2);
  if (!r1.ok) return triangleFail(r1.failure.code, r1.failure.details);
  const r2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2);
  if (!r2.ok) return triangleFail(r2.failure.code, r2.failure.details);
  const r3 = checkTriangleAssign(conSeg3.arguments, tri1, tri2);
  if (!r3.ok) return triangleFail(r3.failure.code, r3.failure.details);

  const s11 = r1.left;
  const s21 = r1.right;
  const s12 = r2.left;
  const s22 = r2.right;
  const s13 = r3.left;
  const s23 = r3.right;

  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);

  t1.orderTriangle(
    [commonPt(s11, s12), commonPt(s12, s13), commonPt(s13, s11)],
    ctx,
  );
  t2.orderTriangle(
    [commonPt(s21, s22), commonPt(s22, s23), commonPt(s23, s21)],
    ctx,
  );

  return triangleOk();
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
): TriangleReasonResult => {
  const dup = checkDistinctDependencyStmts("aas", [conAng1, conAng2, conSeg]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = congruentTrianglePair(t_cong, ctx);

  const e1 = checkTriangleAssign(conAng1.arguments, tri1, tri2);
  if (!e1.ok) return triangleFail(e1.failure.code, e1.failure.details);
  const e2 = checkTriangleAssign(conAng2.arguments, tri1, tri2);
  if (!e2.ok) return triangleFail(e2.failure.code, e2.failure.details);
  const es = checkTriangleAssign(conSeg.arguments, tri1, tri2);
  if (!es.ok) return triangleFail(es.failure.code, es.failure.details);

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
    return triangleFail("AAS_PATTERN", { t1Valid, t2Valid });
  }

  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);

  t1.orderTriangle([a11c, a12c, s1.replace(a11c, "").replace(a12c, "")], ctx);
  t2.orderTriangle([a21c, a22c, s2.replace(a21c, "").replace(a22c, "")], ctx);

  return triangleOk();
};

export const checkAsa = (
  t_cong: Stmt,
  conAng1: Stmt,
  conSeg: Stmt,
  conAng2: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const dup = checkDistinctDependencyStmts("asa", [conAng1, conSeg, conAng2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = congruentTrianglePair(t_cong, ctx);

  const e1 = checkTriangleAssign(conAng1.arguments, tri1, tri2);
  if (!e1.ok) return triangleFail(e1.failure.code, e1.failure.details);
  const e2 = checkTriangleAssign(conAng2.arguments, tri1, tri2);
  if (!e2.ok) return triangleFail(e2.failure.code, e2.failure.details);
  const es = checkTriangleAssign(conSeg.arguments, tri1, tri2);
  if (!es.ok) return triangleFail(es.failure.code, es.failure.details);

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
    return triangleFail("ASA_PATTERN", { t1Valid, t2Valid });
  }

  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);

  t1.orderTriangle([a11c, a12c, t1.getThirdPoint(a11c, a12c)], ctx);
  t2.orderTriangle([a21c, a22c, t2.getThirdPoint(a21c, a22c)], ctx);

  return triangleOk();
};

const rhlLegPattern = (
  segLeft1: string,
  segLeft2: string,
  rightCenter: string,
): boolean => {
  return (
    (!segLeft1.includes(rightCenter) && segLeft2.includes(rightCenter)) ||
    (segLeft1.includes(rightCenter) && !segLeft2.includes(rightCenter))
  );
};

export const checkRhl = (
  t_cong: Stmt,
  rightCon: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const dup = checkDistinctDependencyStmts("rhl", [rightCon, conSeg1, conSeg2]);
  if (!dup.ok) return dup;
  const [tri1, tri2] = congruentTrianglePair(t_cong, ctx);

  const er = checkTriangleAssign(rightCon.arguments, tri1, tri2);
  if (!er.ok)
    return triangleFail(
      er.failure.code,

      er.failure.details,
    );
  const h1 = checkTriangleAssign(conSeg1.arguments, tri1, tri2);
  if (!h1.ok) return triangleFail(h1.failure.code, h1.failure.details);
  const h2 = checkTriangleAssign(conSeg2.arguments, tri1, tri2);
  if (!h2.ok) return triangleFail(h2.failure.code, h2.failure.details);

  const r1 = er.left;
  const r2 = er.right;
  const s11 = h1.left;
  const s12 = h1.right;
  const s21 = h2.left;
  const s22 = h2.right;

  const r1c = angCenter(r1);
  const r2c = angCenter(r2);

  const t1Valid = rhlLegPattern(s11, s12, r1c);
  const t2Valid = rhlLegPattern(s21, s22, r2c);

  if (!(t1Valid && t2Valid)) {
    return triangleFail("RHL_PATTERN", { t1Valid, t2Valid, r1c, r2c });
  }

  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);

  const t1c2 = commonPt(s11, s12);
  const t2c2 = commonPt(s21, s22);

  t1.orderTriangle([r1c, t1c2, t1.getThirdPoint(r1c, t1c2)], ctx);
  t2.orderTriangle([r2c, t2c2, t2.getThirdPoint(r2c, t2c2)], ctx);

  return triangleOk();
};

const checkCpctcSegment = (
  tri1: Triangle,
  tri2: Triangle,
  conclusion: Stmt,
): TriangleReasonResult => {
  const assign = checkTriangleAssign(conclusion.arguments, tri1, tri2);
  if (!assign.ok) {
    return triangleFail(assign.failure.code, assign.failure.details);
  }
  if (
    tri1.getSegmentIndex(assign.left) !== tri2.getSegmentIndex(assign.right)
  ) {
    return triangleFail("CPCTC_SEG_INDEX", {
      // segments are not corresponding
      seg1: assign.left,
      seg2: assign.right,
    });
  }
  return triangleOk();
};

const checkCpctcAngle = (
  tri1: Triangle,
  tri2: Triangle,
  conclusion: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const assign = checkTriangleAssign(conclusion.arguments, tri1, tri2);
  if (!assign.ok) {
    return triangleFail(assign.failure.code, assign.failure.details);
  }
  const t1 = ctx.addTriangleFromStr(tri1.label);
  const t2 = ctx.addTriangleFromStr(tri2.label);
  if (t1.getAngleIndex(assign.left) !== t2.getAngleIndex(assign.right)) {
    return triangleFail("CPCTC_ANG_INDEX", {
      // angles are not corresponding
      ang1: assign.left,
      ang2: assign.right,
    });
  }
  return triangleOk();
};

export const checkCpctc = (
  t_cong: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const [tri1, tri2] = congruentTrianglePair(t_cong, ctx);

  if (conclusion.function === "con_seg") {
    return checkCpctcSegment(tri1, tri2, conclusion);
  }
  if (conclusion.function === "con_ang") {
    return checkCpctcAngle(tri1, tri2, conclusion, ctx);
  }
  return triangleFail("CPCTC_CONCLUSION", { function: conclusion.function });
};

export const checkIsosceles = (
  conSeg: Stmt,
  isoscelesStmt: Stmt,
  ctx: ProofContent,
): TriangleReasonResult => {
  const tempCtx = new ProofContent(ctx.getCtx());
  const [s1, s2] = conSegMapper(conSeg, tempCtx);
  const [t] = conTriMapper(isoscelesStmt, tempCtx);

  if (!(t.contains(s1) && t.contains(s2) && !s1.equals(s2))) {
    return triangleFail("ISOSCELES_PATTERN");
  }
  ctx.addTriangleFromStr(t.label);
  return triangleOk();
};
