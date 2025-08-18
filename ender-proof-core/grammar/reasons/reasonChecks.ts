// sas.ts
// Function to check if two triangles meet SAS (Side-Angle-Side) congruence requirements

import {
  Angle,
  DiagramContent,
  Point,
  Segment,
  Statement,
} from "geometry-object";
import { angCenter, checks, commonPt } from "./utils";

export type SegmentPair = [Segment, Segment];
export type AnglePair = [Angle, Angle];

export const reflex_s = (s1: Segment, s2: Segment) => {
  return checks.eqSeg(s1, s2);
};

export const reflex_a = (a1: Angle, a2: Angle) => {
  return checks.eqAng(a1, a2);
};

export const verticalAngles = (
  s1: Segment,
  s2: Segment,
  intersect: Point,
  a1: Angle,
  a2: Angle
) => {
  // knowing that s1 and s2 intersect at intersect, check that a1 and a2 are vertical angles
  // check whether each param is defined
  // check that a1/a2 are 2 different angles
  // check that a1/a2 are on opposite sides of the line s1 and s2
};

export const sameSide = (s1: Segment, s2: Segment) => {
  return s1.p1.label === s2.p1.label && s1.p2.label === s2.p2.label;
};

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
  conTri: Statement,
  conSeg1: Statement,
  conAng: Statement,
  conSeg2: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(conTri.arguments);

  const [s11, s12, s1Valid] = checkTriangleAssign(
    conSeg1.arguments,
    tri1,
    tri2
  );
  const [s21, s22, s2Valid] = checkTriangleAssign(
    conSeg2.arguments,
    tri1,
    tri2
  );
  const [a1, a2, aValid] = checkTriangleAssign(
    stripAngPrefix(conAng.arguments),
    tri1,
    tri2
  );

  // For angle ABC, center point is B (middle character)
  const center1 = a1[1];
  const center2 = a2[1];

  // Check SAS pattern for triangle 1: both segments must contain the angle center point
  const triangle1SAS = s11.includes(center1) && s12.includes(center1);

  // Check SAS pattern for triangle 2: both segments must contain the angle center point
  const triangle2SAS = s21.includes(center2) && s22.includes(center2);

  const valid = triangle1SAS && triangle2SAS && s1Valid && s2Valid && aValid;
  if (valid) {
    const t1 = ctx.getTriangle(tri1);
    const t2 = ctx.getTriangle(tri2);

    const t1center2 = s11.replace(center1, "");
    const t1center3 = t1.getThirdPoint(center1, t1center2);

    const t2center2 = s21.replace(center2, "");
    const t2center3 = t2.getThirdPoint(center2, t2center2);

    t1.orderTriangle([center1, t1center2, t1center3], ctx);
    t2.orderTriangle([center2, t2center2, t2center3], ctx);
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
  t_cong: Statement,
  conSeg1: Statement,
  conSeg2: Statement,
  conSeg3: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

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
    const t1 = ctx.getTriangle(tri1);
    const t2 = ctx.getTriangle(tri2);

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
  t_cong: Statement,
  conAng1: Statement,
  conAng2: Statement,
  conSeg: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

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
    const t1 = ctx.getTriangle(tri1);
    const t2 = ctx.getTriangle(tri2);

    // segment will be made up of 1 angle center point and the 3rd point, strip angle center points to get 3rd pt
    t1.orderTriangle([a11c, a12c, s1.replace(a11c, "").replace(a12c, "")], ctx);
    t2.orderTriangle([a21c, a22c, s2.replace(a21c, "").replace(a22c, "")], ctx);
  }

  return valid;
};

export const asa = (
  t_cong: Statement,
  conAng1: Statement,
  conSeg: Statement,
  conAng2: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

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
    const t1 = ctx.getTriangle(tri1);
    const t2 = ctx.getTriangle(tri2);

    t1.orderTriangle([a11c, a12c, t1.getThirdPoint(a11c, a12c)], ctx);
    t2.orderTriangle([a21c, a22c, t2.getThirdPoint(a21c, a22c)], ctx);
  }

  return valid;
};

export const rhl = (
  t_cong: Statement,
  rightCon: Statement,
  conSeg1: Statement,
  conSeg2: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

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
    const t1 = ctx.getTriangle(tri1);
    const t2 = ctx.getTriangle(tri2);

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
  t_cong: Statement,
  conclusion: Statement,
  ctx: DiagramContent
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

  // Check if the conclusion is a segment or angle congruence
  if (conclusion.function === "con_seg") {
    // For segment congruence, check that both segments are parts of the congruent triangles
    const [seg1, seg2, segValid] = checkTriangleAssign(
      conclusion.arguments,
      tri1,
      tri2
    );

    const [t1, t2] = [ctx.getTriangle(tri1), ctx.getTriangle(tri2)];

    // check that seg1 is the same index in tri1 as seg2 is in tri2
    return segValid && t1.getSegmentIndex(seg1) === t2.getSegmentIndex(seg2);
  } else if (conclusion.function === "con_ang") {
    // For angle congruence, check that both angles are parts of the congruent triangles
    const [ang1, ang2, angValid] = checkTriangleAssign(
      conclusion.arguments,
      tri1,
      tri2
    );

    const [t1, t2] = [ctx.getTriangle(tri1), ctx.getTriangle(tri2)];
    return angValid && t1.getAngleIndex(ang1) === t2.getAngleIndex(ang2);
  }

  return false;
};

export const intersect_seg = (
  intersect_seg: Statement,
  ctx: DiagramContent
): boolean => {
  const [s1, s2, pt] = intersect_seg.arguments;
  //  check that s1 and s2 are not the same, and p is not in s1 or s2 labels

  const valid =
    s1.split("").every((pt) => !s2.includes(pt)) &&
    !s1.includes(pt) &&
    !s2.includes(pt);
  // if valid, add new subsegments to context
  if (valid) {
    s1.split("").forEach((pt) => ctx.addSegmentFromStr(`${s1[0]}${pt}`));
    s2.split("").forEach((pt) => ctx.addSegmentFromStr(`${s2[0]}${pt}`));
  }

  return valid;
};

export const vert_ang = (
  intersect_seg: Statement,
  conAng: Statement,
  ctx: DiagramContent
): boolean => {
  const [s1, s2, pt] = intersect_seg.arguments;
  // const [a1, a2, angValid] = checkTriangleAssign(
  //   conAng.arguments,
  //   tri1,
  //   tri2
  // );
  //  check that s1 and s2 are not the same, and p is not in s1 or s2 labels
  const valid =
    s1.split("").every((pt) => !s2.includes(pt)) &&
    !s1.includes(pt) &&
    !s2.includes(pt);
  return valid;
};

// ----- Helper functions -----

// Helper function to check if a segment is in a triangle (all points of segment are in triangle)
const segInTri = (segment: string, triangle: string): boolean => {
  return segment.split("").every((point) => triangle.includes(point));
};

// Helper function to check if an angle is in a triangle (all points of angle are in triangle)
const angInTri = (angle: string, triangle: string): boolean => {
  return angle.split("").every((point) => triangle.includes(point));
};

const sortPairToTri = (
  pair: string[],
  [tri1, tri2]: [string, string]
): [string, string] => {
  const [l, r] = pair;
  if (l === r) {
    return [l, r];
  }

  // Helper function to check if all characters in a string are contained in a triangle
  const allCharsInTriangle = (str: string, triangle: string): boolean => {
    const chars = str.split("");
    return chars.every((char) => triangle.includes(char));
  };

  if (allCharsInTriangle(l, tri1) && allCharsInTriangle(r, tri2)) {
    return [l, r];
  } else if (allCharsInTriangle(r, tri1) && allCharsInTriangle(l, tri2)) {
    return [r, l];
  }

  console.error(
    "sortPairToTri: triangles do not contain all characters of both objects",
    [l, r],
    [tri1, tri2]
  );
  return [l, r];
};

// Helper function to check that each segment or angle is assigned to only 1 triangle
// special case: if a side is shared between 2 triangles, it can be assigned to both
// and sort the pair to correct triangles
const checkTriangleAssign = (
  pair: string[],
  tri1: string,
  tri2: string
): [string, string, boolean] => {
  let inTriangleFn: (obj: string, triangle: string) => boolean = segInTri;
  if (pair[0].startsWith("a_")) {
    pair = stripAngPrefix(pair);
    inTriangleFn = angInTri;
  }

  const [obj1, obj2] = sortPairToTri(pair, [tri1, tri2]);
  const obj1_in_t1 = inTriangleFn(obj1, tri1);
  const obj2_in_t2 = inTriangleFn(obj2, tri2);
  const obj1_in_t2 = inTriangleFn(obj1, tri2);
  const obj2_in_t1 = inTriangleFn(obj2, tri1);
  return [
    obj1,
    obj2,
    // either obj1 === obj2, or one is in tri1 and the other is in tri2
    obj1 === obj2 ||
      (obj1_in_t1 && obj2_in_t2 && !obj1_in_t2 && !obj2_in_t1) ||
      (obj1_in_t2 && obj2_in_t1 && !obj1_in_t1 && !obj2_in_t2),
  ];
};

const stripAngPrefix = (angles: string[]) => {
  return angles.map((angle) => angle.replace("a_", ""));
};

const stripTriPrefix = (triangles: string[]) => {
  return triangles.map((triangle) => triangle.replace("t_", ""));
};
