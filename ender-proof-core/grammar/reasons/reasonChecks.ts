// sas.ts
// Function to check if two triangles meet SAS (Side-Angle-Side) congruence requirements

import { Angle, Point, Segment, Statement } from "geometry-object";
import { checks } from "./utils";

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
 * @param t_cong - Triangle congruence statement (con_tri)
 * @param s1_stmt - First segment congruence statement (con_seg)
 * @param angle_stmt - Angle congruence statement (con_ang)
 * @param s2_stmt - Second segment congruence statement (con_seg)
 * @returns true if the triangles meet SAS requirements, false otherwise
 */
export const sas = (
  conTri: Statement,
  conSeg1: Statement,
  conAng: Statement,
  conSeg2: Statement
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(conTri.arguments);

  const [s11, s12] = sortPairToTri(conSeg1.arguments, [tri1, tri2]);
  const [s21, s22] = sortPairToTri(conSeg2.arguments, [tri1, tri2]);
  const [a1, a2] = sortPairToTri(stripAngPrefix(conAng.arguments), [
    tri1,
    tri2,
  ]);

  // For angle ABC, center point is B (middle character)
  const center1 = a1[1];
  const center2 = a2[1];

  // Check SAS pattern for triangle 1: both segments must contain the angle center point
  const triangle1SAS =
    s11.includes(center1) &&
    s21.includes(center1) &&
    segInTri(s11, tri1) &&
    segInTri(s21, tri1) &&
    angInTri(a1, tri1);

  // Check SAS pattern for triangle 2: both segments must contain the angle center point
  const triangle2SAS =
    s12.includes(center2) &&
    s22.includes(center2) &&
    segInTri(s12, tri2) &&
    segInTri(s22, tri2) &&
    angInTri(a2, tri2);

  return triangle1SAS && triangle2SAS;
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
  s1_stmt: Statement,
  s2_stmt: Statement,
  s3_stmt: Statement
): boolean => {
  // Extract triangle names (remove t_ prefix)
  const [tri1, tri2] = stripTriPrefix(t_cong.arguments);

  // Extract segment names
  const [s11, s12] = sortPairToTri(s1_stmt.arguments, [tri1, tri2]);
  const [s21, s22] = sortPairToTri(s2_stmt.arguments, [tri1, tri2]);
  const [s31, s32] = sortPairToTri(s3_stmt.arguments, [tri1, tri2]);

  // Validate triangle assignments for each pair of segments
  const seg1Valid = validateTriangleAssignment(s11, s12, tri1, tri2, segInTri);
  const seg2Valid = validateTriangleAssignment(s21, s22, tri1, tri2, segInTri);
  const seg3Valid = validateTriangleAssignment(s31, s32, tri1, tri2, segInTri);

  // All three pairs of segments must be valid for SSS congruence
  return seg1Valid && seg2Valid && seg3Valid;
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

// Helper function to validate triangle assignment for a pair of objects
const validateTriangleAssignment = (
  obj1: string,
  obj2: string,
  tri1: string,
  tri2: string,
  inTriangleFn: (obj: string, triangle: string) => boolean
): boolean => {
  const obj1_in_t1 = inTriangleFn(obj1, tri1);
  const obj2_in_t2 = inTriangleFn(obj2, tri2);
  const obj1_in_t2 = inTriangleFn(obj1, tri2);
  const obj2_in_t1 = inTriangleFn(obj2, tri1);
  // either obj1 === obj2, or one is in tri1 and the other is in tri2
  return (
    obj1 === obj2 ||
    (obj1_in_t1 && obj2_in_t2 && !obj1_in_t2 && !obj2_in_t1) ||
    (obj1_in_t2 && obj2_in_t1 && !obj1_in_t1 && !obj2_in_t2)
  );
};

const stripAngPrefix = (angles: string[]) => {
  return angles.map((angle) => angle.replace("a_", ""));
};

const stripTriPrefix = (triangles: string[]) => {
  return triangles.map((triangle) => triangle.replace("t_", ""));
};
