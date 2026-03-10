import { logError } from "../../errors/errorConstants";
import { DiagramContent, Triangle } from "geometry-object";
import { ParseObj, Stmt } from "../../types/checkerTypes";
import { conSegMapper, conTriMapper } from "./argMappers";
import { angCenter, commonPt } from "./utils";

/**
 * Checks if two triangles meet the SAS (Side-Angle-Side) congruence requirements.
 *
 * @param conTri - Triangle congruence statement (con_tri)
 * @param conSeg1 - First segment congruence statement (con_seg)
 * @param conAng - Angle congruence statement (con_ang)
 * @param conSeg2 - Second segment congruence statement (con_seg)
 * @returns true if the triangles meet SAS requirements, false otherwise
 */
export const sas = (
  conTri: Stmt,
  conSeg1: Stmt,
  conAng: Stmt,
  conSeg2: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(conTri, tempCtx);

  const [s11, s21, s1Valid] = checkTriangleAssign(
    conSeg1.arguments,
    tri1,
    tri2
  );
  const [s12, s22, s2Valid] = checkTriangleAssign(
    conSeg2.arguments,
    tri1,
    tri2
  );
  const [a1, a2, aValid] = checkTriangleAssign(conAng.arguments, tri1, tri2);

  // For angle ABC, center point is B (middle character)
  const center1 = a1[1];
  const center2 = a2[1];

  // Check SAS pattern for triangle 1: both segments must contain the angle center point
  const triangle1SAS = s11.includes(center1) && s12.includes(center1);

  // Check SAS pattern for triangle 2: both segments must contain the angle center point
  const triangle2SAS = s21.includes(center2) && s22.includes(center2);

  console.log(s1Valid, s2Valid, aValid, triangle1SAS, triangle2SAS, a1, a2);

  const valid = triangle1SAS && triangle2SAS && s1Valid && s2Valid && aValid;
  if (valid) {
    const t1 = ctx.addTriangleFromStr(tri1.label);
    const t2 = ctx.addTriangleFromStr(tri2.label);

    const t1cp2 = s11.replace(center1, "");
    const t1p3 = t1.getThirdPoint(center1, t1cp2);

    const t2p2 = s21.replace(center2, "");
    const t2p3 = t2.getThirdPoint(center2, t2p2);

    t1.orderTriangle([center1, t1cp2, t1p3], ctx);
    t2.orderTriangle([center2, t2p2, t2p3], ctx);
  }

  return valid;
};

/**
 * Checks if two triangles meet the SSS (Side-Side-Side) congruence requirements.
 *
 * @param t_cong - Triangle congruence statement (con_tri)
 * @param s1_stmt - First segment congruence statement (con_seg)
 * @param s2_stmt - Second segment congruence statement (con_seg)
 * @param s3_stmt - Third segment congruence statement (con_seg)
 * @returns true if the triangles meet SSS requirements, false otherwise
 */
export const sss = (
  t_cong: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  conSeg3: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(t_cong, tempCtx);

  // Validate triangle assignments for each pair of segments
  const [s11, s21, seg1Valid] = checkTriangleAssign(
    conSeg1.arguments,
    tri1,
    tri2
  );
  const [s12, s22, seg2Valid] = checkTriangleAssign(
    conSeg2.arguments,
    tri1,
    tri2
  );
  const [s13, s23, seg3Valid] = checkTriangleAssign(
    conSeg3.arguments,
    tri1,
    tri2
  );

  const valid = seg1Valid && seg2Valid && seg3Valid;
  if (valid) {
    // first corner = corner between s11 and s12
    const t1 = ctx.addTriangleFromStr(tri1.label);
    const t2 = ctx.addTriangleFromStr(tri2.label);

    t1.orderTriangle(
      [commonPt(s11, s12), commonPt(s12, s13), commonPt(s13, s11)],
      ctx
    );
    t2.orderTriangle(
      [commonPt(s21, s22), commonPt(s22, s23), commonPt(s23, s21)],
      ctx
    );
  }
  // All three pairs of segments must be valid for SSS congruence
  return valid;
};

export const aas = (
  t_cong: Stmt,
  conAng1: Stmt,
  conAng2: Stmt,
  conSeg: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(t_cong, tempCtx);

  // Validate triangle assignments for each pair of segments
  const [a11, a21, ang1Valid] = checkTriangleAssign(
    conAng1.arguments,
    tri1,
    tri2
  );
  const [a12, a22, ang2Valid] = checkTriangleAssign(
    conAng2.arguments,
    tri1,
    tri2
  );
  const [s1, s2, segValid] = checkTriangleAssign(conSeg.arguments, tri1, tri2);

  const [a11c, a12c] = [angCenter(a11), angCenter(a12)];
  const [a21c, a22c] = [angCenter(a21), angCenter(a22)];

  // check that side contains exactly one angle center point from each triangle
  const t1Valid =
    (s1.includes(a11c) && !s1.includes(a12c)) ||
    (!s1.includes(a11c) && s1.includes(a12c));
  const t2Valid =
    (s2.includes(a21c) && !s2.includes(a22c)) ||
    (!s2.includes(a21c) && s2.includes(a22c));

  const valid = t1Valid && t2Valid && ang1Valid && ang2Valid && segValid;

  if (valid) {
    const t1 = ctx.addTriangleFromStr(tri1.label);
    const t2 = ctx.addTriangleFromStr(tri2.label);

    // segment will be made up of 1 angle center point and the 3rd point, strip angle center points to get 3rd pt
    t1.orderTriangle([a11c, a12c, s1.replace(a11c, "").replace(a12c, "")], ctx);
    t2.orderTriangle([a21c, a22c, s2.replace(a21c, "").replace(a22c, "")], ctx);
  }

  return valid;
};

export const asa = (
  t_cong: Stmt,
  conAng1: Stmt,
  conSeg: Stmt,
  conAng2: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(t_cong, tempCtx);

  // Validate triangle assignments for each pair of segments
  const [a11, a21, ang1Valid] = checkTriangleAssign(
    conAng1.arguments,
    tri1,
    tri2
  );
  const [a12, a22, ang2Valid] = checkTriangleAssign(
    conAng2.arguments,
    tri1,
    tri2
  );
  const [s1, s2, segValid] = checkTriangleAssign(conSeg.arguments, tri1, tri2);

  // check that the segment contains both angle centerpoints
  const [a11c, a12c] = [angCenter(a11), angCenter(a12)];
  const [a21c, a22c] = [angCenter(a21), angCenter(a22)];
  const t1Valid = s1.includes(a11c) && s1.includes(a12c);
  const t2Valid = s2.includes(a21c) && s2.includes(a22c);

  const valid = t1Valid && t2Valid && ang1Valid && ang2Valid && segValid;

  if (valid) {
    const t1 = ctx.addTriangleFromStr(tri1.label);
    const t2 = ctx.addTriangleFromStr(tri2.label);

    t1.orderTriangle([a11c, a12c, t1.getThirdPoint(a11c, a12c)], ctx);
    t2.orderTriangle([a21c, a22c, t2.getThirdPoint(a21c, a22c)], ctx);
  }

  return valid;
};

export const rhl = (
  t_cong: Stmt,
  rightCon: Stmt,
  conSeg1: Stmt,
  conSeg2: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(t_cong, tempCtx);

  // Validate triangle assignments for each pair of segments
  const [r1, r2, rightValid] = checkTriangleAssign(
    rightCon.arguments,
    tri1,
    tri2
  );
  const [s11, s12, hypValid] = checkTriangleAssign(
    conSeg1.arguments,
    tri1,
    tri2
  );
  const [s21, s22, segValid] = checkTriangleAssign(
    conSeg2.arguments,
    tri1,
    tri2
  );

  // check that one of the segments does not contain right angle center point
  const [r1c, r2c] = [angCenter(r1), angCenter(r2)];
  const t1Valid =
    (!s11.includes(r1c) && s12.includes(r1c)) ||
    (s11.includes(r1c) && !s12.includes(r1c));
  const t2Valid =
    (!s21.includes(r2c) && !s22.includes(r2c)) ||
    (s21.includes(r2c) && !s22.includes(r2c));

  const valid = t1Valid && t2Valid && rightValid && hypValid && segValid;
  if (valid) {
    const t1 = ctx.addTriangleFromStr(tri1.label);
    const t2 = ctx.addTriangleFromStr(tri2.label);

    // the 2 segments meet at a second point
    const t1c2 = commonPt(s11, s12);
    const t2c2 = commonPt(s21, s22);

    t1.orderTriangle([r1c, t1c2, t1.getThirdPoint(r1c, t1c2)], ctx);
    t2.orderTriangle([r2c, t2c2, t2.getThirdPoint(r2c, t2c2)], ctx);
  }

  return valid;
};

/**
 * Checks if CPCTC can be applied.
 *
 * @param t_cong - Triangle congruence statement (con_tri)
 * @param conclusion - The conclusion statement (either con_seg or con_ang)
 * @param ctx - Diagram context
 * @returns true if CPCTC can be applied to derive the conclusion, false otherwise
 */
export const cpctc = (
  t_cong: Stmt,
  conclusion: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [tri1, tri2] = conTriMapper(t_cong, tempCtx);

  // Check if the conclusion is a segment or angle congruence
  if (conclusion.function === "con_seg") {
    // For segment congruence, check that both segments are parts of the congruent triangles
    const [seg1, seg2, segValid] = checkTriangleAssign(
      conclusion.arguments,
      tri1,
      tri2
    );

    // check that seg1 is the same index in tri1 as seg2 is in tri2
    return (
      segValid && tri1.getSegmentIndex(seg1) === tri2.getSegmentIndex(seg2)
    );
  } else if (conclusion.function === "con_ang") {
    // For angle congruence, check that both angles are parts of the congruent triangles
    const [ang1, ang2, angValid] = checkTriangleAssign(
      conclusion.arguments,
      tri1,
      tri2
    );

    const [t1, t2] = [
      ctx.addTriangleFromStr(tri1.label),
      ctx.addTriangleFromStr(tri2.label),
    ];
    console.log(
      ang1,
      ang2,
      angValid,
      t1.getAngleIndex(ang1) === t2.getAngleIndex(ang2)
    );
    return angValid && t1.getAngleIndex(ang1) === t2.getAngleIndex(ang2);
  }

  return false;
};

export const isosceles = (
  conSeg: Stmt,
  isosceles: Stmt,
  ctx: DiagramContent
): boolean => {
  const tempCtx = new DiagramContent(ctx.getCtx());
  const [s1, s2] = conSegMapper(conSeg, tempCtx);
  const [t] = conTriMapper(isosceles, tempCtx);

  console.log("isosceles", t.contains(s1), t.contains(s2), !s1.equals(s2));
  const valid = t.contains(s1) && t.contains(s2) && !s1.equals(s2);
  if (valid) {
    ctx.addTriangleFromStr(t.label);
  }
  return valid;
};

// Helper functions ================================

const sortPairToTri = (
  pair: ParseObj[],
  [tri1, tri2]: [Triangle, Triangle]
): [ParseObj, ParseObj] => {
  const [l, r] = pair;
  if (l.v === r.v) {
    return [l, r];
  }

  if (tri1.containsParseObj(l) && tri2.containsParseObj(r)) {
    return [l, r];
  } else if (tri1.containsParseObj(r) && tri2.containsParseObj(l)) {
    return [r, l];
  }

  logError.geometric.trianglesDoNotContainObjects([l.v, r.v], [tri1, tri2]);
  return [l, r];
};

// Helper function to check that each segment or angle is assigned to only 1 triangle
// special case: if a side is shared between 2 triangles, it can be assigned to both
// and sort the pair to correct triangles
const checkTriangleAssign = (
  pair: ParseObj[],
  tri1: Triangle,
  tri2: Triangle
): [string, string, boolean] => {
  const [obj1, obj2] = sortPairToTri(pair, [tri1, tri2]);
  const obj1_in_t1 = tri1.containsParseObj(obj1);
  const obj2_in_t2 = tri2.containsParseObj(obj2);
  const obj1_in_t2 = tri2.containsParseObj(obj1);
  const obj2_in_t1 = tri1.containsParseObj(obj2);
  return [
    obj1.v,
    obj2.v,
    // either obj1 === obj2, or one is in tri1 and the other is in tri2
    obj1.v === obj2.v ||
      (obj1_in_t1 && obj2_in_t2 && !obj1_in_t2 && !obj2_in_t1) ||
      (obj1_in_t2 && obj2_in_t1 && !obj1_in_t1 && !obj2_in_t2),
  ];
};
