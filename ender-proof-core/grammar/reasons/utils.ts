import { Angle, Segment, Triangle } from "geometry-object";

/**
 * Checks if two segments are congruent (have same label)
 */
const eqSeg = (s1: Segment, s2: Segment): boolean => {
  return (
    (s1.p1.label === s2.p1.label && s1.p2.label === s2.p2.label) ||
    (s1.p1.label === s2.p2.label && s1.p2.label === s2.p1.label)
  );
};

/**
 * Checks if two angles are congruent (have same label)
 */
const eqAng = (a1: Angle, a2: Angle): boolean => {
  return (
    (a1.start.label === a2.start.label &&
      a1.center.label === a2.center.label &&
      a1.end.label === a2.end.label) ||
    (a1.start.label === a2.end.label &&
      a1.center.label === a2.center.label &&
      a1.end.label === a2.start.label)
  );
};

/**
 * Checks if a segment is part of a triangle
 */
const segInTri = (segment: Segment, triangle: Triangle): boolean => {
  return triangle.s.some((s) => eqSeg(s, segment));
};

/**
 * Checks if an angle is part of a triangle
 */
const angInTri = (angle: Angle, triangle: Triangle): boolean => {
  return triangle.a.some((a) => eqAng(a, angle));
};

export const checks = {
  eqSeg,
  eqAng,
  segInTri,
  angInTri,
};
