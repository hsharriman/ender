// sas.ts
// Function to check if two triangles meet SAS (Side-Angle-Side) congruence requirements

import { Angle, Segment, Triangle } from "geometry-object";

type SegmentPair = [Segment, Segment];
type AnglePair = [Angle, Angle];

/**
 * Checks if two triangles meet the SAS (Side-Angle-Side) congruence requirements.
 *
 * @param triangle1 - First triangle
 * @param triangle2 - Second triangle
 * @param segmentPairs - Optional array of 2 segment pairs that should be congruent
 * @param anglePair - Optional angle pair that should be congruent
 * @returns true if the triangles meet SAS requirements, false otherwise
 */
export function sas(
  triangle1: Triangle,
  triangle2: Triangle,
  segmentPairs?: [SegmentPair, SegmentPair],
  anglePair?: AnglePair
): boolean {
  // If no segment pairs or angle pair provided, we can't verify SAS
  if (!segmentPairs || segmentPairs.length !== 2 || !anglePair) {
    return false;
  }

  const [segmentPair1, segmentPair2] = segmentPairs;
  const [angle1, angle2] = anglePair;

  // Check that the segments are congruent (same length)
  const segmentsCongruent =
    areSegmentsCongruent(segmentPair1[0], segmentPair1[1]) &&
    areSegmentsCongruent(segmentPair2[0], segmentPair2[1]);

  // Check that the angles are congruent (same measure)
  const anglesCongruent = areAnglesCongruent(angle1, angle2);

  // Check that the segments and angles are part of the given triangles
  const segmentsInTriangles =
    isSegmentInTriangle(segmentPair1[0], triangle1) &&
    isSegmentInTriangle(segmentPair1[1], triangle2) &&
    isSegmentInTriangle(segmentPair2[0], triangle1) &&
    isSegmentInTriangle(segmentPair2[1], triangle2);

  const anglesInTriangles =
    isAngleInTriangle(angle1, triangle1) &&
    isAngleInTriangle(angle2, triangle2);

  return (
    segmentsCongruent &&
    anglesCongruent &&
    segmentsInTriangles &&
    anglesInTriangles
  );
}

/**
 * Checks if two segments are congruent (have the same length)
 */
function areSegmentsCongruent(segment1: Segment, segment2: Segment): boolean {
  // In a real implementation, this would check actual segment lengths
  // For now, we'll assume segments with the same point labels are congruent
  return (
    (segment1.p1.label === segment2.p1.label && segment1.p2.label === segment2.p2.label) ||
    (segment1.p1.label === segment2.p2.label && segment1.p2.label === segment2.p1.label)
  );
}

/**
 * Checks if two angles are congruent (have the same measure)
 */
function areAnglesCongruent(angle1: Angle, angle2: Angle): boolean {
  // In a real implementation, this would check actual angle measures
  // For now, we'll assume angles with the same point labels are congruent
  return (
    (angle1.start.label === angle2.start.label && 
     angle1.center.label === angle2.center.label && 
     angle1.end.label === angle2.end.label) ||
    (angle1.start.label === angle2.end.label && 
     angle1.center.label === angle2.center.label && 
     angle1.end.label === angle2.start.label)
  );
}

/**
 * Checks if a segment is part of a triangle
 */
function isSegmentInTriangle(segment: Segment, triangle: Triangle): boolean {
  const trianglePoints = [triangle.p[0].label, triangle.p[1].label, triangle.p[2].label];
  return (
    trianglePoints.includes(segment.p1.label) && trianglePoints.includes(segment.p2.label)
  );
}

/**
 * Checks if an angle is part of a triangle
 */
function isAngleInTriangle(angle: Angle, triangle: Triangle): boolean {
  const trianglePoints = [triangle.p[0].label, triangle.p[1].label, triangle.p[2].label];
  return (
    trianglePoints.includes(angle.start.label) &&
    trianglePoints.includes(angle.center.label) &&
    trianglePoints.includes(angle.end.label)
  );
}
