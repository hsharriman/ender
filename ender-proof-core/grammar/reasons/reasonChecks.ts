// sas.ts
// Function to check if two triangles meet SAS (Side-Angle-Side) congruence requirements

import { Angle, Point, Segment, Triangle } from "geometry-object";
import { checks } from "./utils";

type SegmentPair = [Segment, Segment];
type AnglePair = [Angle, Angle];

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
 * @param t1 - First triangle
 * @param t2 - Second triangle
 * @param s1s - Optional segment pair that should be congruent
 * @param s2s - Optional segment pair that should be congruent
 * @param as - Optional angle pair that should be congruent
 * @returns true if the triangles meet SAS requirements, false otherwise
 */
export const sas = (
  t1: Triangle,
  t2: Triangle,
  s1s: SegmentPair,
  s2s: SegmentPair,
  as: AnglePair
): boolean => {
  // Check that s1s and s2s are not the same
  if (
    !t1.isEqualTo(t2) &&
    (checks.eqSeg(s1s[0], s2s[0]) || checks.eqSeg(s1s[0], s2s[1]))
  ) {
    return false;
  }

  const [angle1, angle2] = as;

  // Check that the segments are congruent (same length)
  const segmentsCongruent =
    checks.eqSeg(s1s[0], s1s[1]) && checks.eqSeg(s2s[0], s2s[1]);

  // Check that the angles are congruent (same measure)
  const anglesCongruent = checks.eqAng(angle1, angle2);

  // Check that the segments and angles are part of the given triangles
  const segmentsInTriangles =
    checks.segInTri(s1s[0], t1) &&
    checks.segInTri(s1s[1], t2) &&
    checks.segInTri(s2s[0], t1) &&
    checks.segInTri(s2s[1], t2);

  const anglesInTriangles =
    checks.angInTri(angle1, t1) && checks.angInTri(angle2, t2);

  return (
    segmentsCongruent &&
    anglesCongruent &&
    segmentsInTriangles &&
    anglesInTriangles
  );
};
