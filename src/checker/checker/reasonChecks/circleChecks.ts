import { Angle, Circle, Point, ProofContent, Segment } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import { reasonApplicationFail, reasonApplicationOk } from "./reasonResult";
import { checkDistinctDependencyStmts, failReflexStatements } from "./utils";

// Returns true if seg goes between the circle center and the tangency point
// (i.e., it's the radius segment from center to p).
const isRadiusSegment = (seg: Segment, circle: Circle, p: Point): boolean =>
  seg.contains(circle.center) && seg.contains(p);

// Shared core: validates that tangent(c, s_tan, p), radius(c, p), perp(s_tan, s_rad, p)
// are mutually consistent. Called directly for tangent_perp and with arguments swapped
// for tangent_perp_conv (where the conclusion supplies the tangent statement).
export const checkTangentPerpRelationship = (
  tangentStmt: Stmt,
  radiusStmt: Stmt,
  perpStmt: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([tangentStmt, radiusStmt]);
  if (!dup.ok) return dup;

  const [circle_tan, s_tan, p_tan] = stmtMapper(tangentStmt, ctx) as [
    Circle,
    Segment,
    Point,
  ];
  const [circle_rad, p_rad] = stmtMapper(radiusStmt, ctx) as [Circle, Point];
  const [s1, s2, p_int] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];

  if (!circle_tan.equals(circle_rad)) {
    return reasonApplicationFail("TANGENT_PERP_CIRCLE_MISMATCH", {
      circle1: circle_tan.label,
      circle2: circle_rad.label,
    });
  }
  if (!p_tan.equals(p_rad)) {
    return reasonApplicationFail("TANGENT_PERP_POINT_MISMATCH", {
      p_tan: p_tan.label,
      p_rad: p_rad.label,
    });
  }
  if (!p_int || !p_int.equals(p_tan)) {
    return reasonApplicationFail("TANGENT_PERP_INT_POINT_MISMATCH", {
      p_int: p_int?.label,
      p_tan: p_tan.label,
    });
  }
  const tanIsS1 = s1.equals(s_tan);
  const tanIsS2 = s2.equals(s_tan);
  if (!tanIsS1 && !tanIsS2) {
    return reasonApplicationFail("TANGENT_SEG_NOT_IN_PERP", {
      tangent: s_tan.label,
    });
  }
  const s_radius = tanIsS1 ? s2 : s1;
  if (!isRadiusSegment(s_radius, circle_tan, p_tan)) {
    return reasonApplicationFail("TANGENT_PERP_RADIUS_MISMATCH", {
      segment: s_radius.label,
      center: circle_tan.center.label,
    });
  }
  return reasonApplicationOk();
};

// con_tangents_ext: tangent(c, s1, p1) + tangent(c, s2, p2) → con_seg(s1, s2)
// Both tangents must share an external point (one non-tangency endpoint in common).
export const con_tangents_ext_check = (
  tan1: Stmt,
  tan2: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([tan1, tan2]);
  if (!dup.ok) return dup;

  const [c1, s1, p1] = stmtMapper(tan1, ctx) as [Circle, Segment, Point];
  const [c2, s2, p2] = stmtMapper(tan2, ctx) as [Circle, Segment, Point];
  const [cs1, cs2] = stmtMapper(conclusion, ctx) as [Segment, Segment];

  if (!c1.equals(c2)) {
    return reasonApplicationFail("CON_TANGENTS_CIRCLE_MISMATCH", {
      c1: c1.label,
      c2: c2.label,
    });
  }
  if (p1.equals(p2)) {
    return reasonApplicationFail("CON_TANGENTS_SAME_TANGENCY_POINT", {
      p: p1.label,
    });
  }
  const segPairMatches =
    (cs1.equals(s1) && cs2.equals(s2)) || (cs1.equals(s2) && cs2.equals(s1));
  if (!segPairMatches) {
    return reasonApplicationFail("CON_TANGENTS_SEG_MISMATCH", {
      s1: s1.label,
      s2: s2.label,
    });
  }
  // Find the non-tangency endpoint of each segment (the shared external point)
  const ext1 = s1.p1.equals(p1) ? s1.p2 : s1.p1;
  const ext2 = s2.p1.equals(p2) ? s2.p2 : s2.p1;
  if (!ext1.equals(ext2)) {
    return reasonApplicationFail("CON_TANGENTS_NO_COMMON_EXT_POINT", {
      ext1: ext1.label,
      ext2: ext2.label,
    });
  }
  return reasonApplicationOk();
};

// radius_chord_bisect: perp(s_rad, s_chord, p) + radius(c, p_r) + chord(c, s_chord)
//   → seg_bisect(s_chord, s_rad, p)
// The radius-direction segment must contain the circle center.
export const radius_chord_bisect_check = (
  perpStmt: Stmt,
  radiusStmt: Stmt,
  chordStmt: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([perpStmt, radiusStmt, chordStmt]);
  if (!dup.ok) return dup;

  const [s_rad, s_ch, p_int] = stmtMapper(perpStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [c_rad] = stmtMapper(radiusStmt, ctx) as [Circle, Point];
  const [c_chord, s_chord] = stmtMapper(chordStmt, ctx) as [Circle, Segment];
  const [cs1, cs2, cp] = stmtMapper(conclusion, ctx) as [
    Segment,
    Segment,
    Point,
  ];

  if (!c_rad.equals(c_chord)) {
    return reasonApplicationFail("RADIUS_CHORD_CIRCLE_MISMATCH", {
      c_rad: c_rad.label,
      c_chord: c_chord.label,
    });
  }
  // One of the perp segments must be the chord
  const chordIsFirst = s_rad.equals(s_chord);
  const chordIsSecond = s_ch.equals(s_chord);
  if (!chordIsFirst && !chordIsSecond) {
    return reasonApplicationFail("RADIUS_CHORD_NOT_PERP_TO_CHORD", {
      chord: s_chord.label,
    });
  }
  const s_perpRad = chordIsFirst ? s_ch : s_rad;
  const s_perpChord = chordIsFirst ? s_rad : s_ch;
  // The non-chord perp segment must contain the circle center
  if (!s_perpRad.contains(c_rad.center)) {
    return reasonApplicationFail("RADIUS_CHORD_NO_CENTER", {
      segment: s_perpRad.label,
      center: c_rad.center.label,
    });
  }
  // Conclusion must reference both the chord and the radius-direction segment
  const hasChord = cs1.equals(s_perpChord) || cs2.equals(s_perpChord);
  const hasRad = cs1.equals(s_perpRad) || cs2.equals(s_perpRad);
  if (!hasChord || !hasRad) {
    return reasonApplicationFail("RADIUS_CHORD_BISECT_SEG_MISMATCH", {
      chord: s_perpChord.label,
      radius: s_perpRad.label,
    });
  }
  if (!cp.equals(p_int)) {
    return reasonApplicationFail("RADIUS_CHORD_BISECT_MIDPOINT_MISMATCH", {
      expected: p_int.label,
      got: cp.label,
    });
  }
  return reasonApplicationOk();
};

// radius_chord_bisect_conv: perp_bisector(s_perp, s_chord, p) + chord(c, s_chord)
//   → radius(c, p_on_circle)
// The conclusion point must be an endpoint of the perpendicular bisecting segment.
export const radius_chord_bisect_conv_check = (
  perpBisectorStmt: Stmt,
  chordStmt: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([perpBisectorStmt, chordStmt]);
  if (!dup.ok) return dup;

  const [s_perp, s_bisected] = stmtMapper(perpBisectorStmt, ctx) as [
    Segment,
    Segment,
    Point,
  ];
  const [c_chord, s_chord] = stmtMapper(chordStmt, ctx) as [Circle, Segment];
  const [c_conc, p_conc] = stmtMapper(conclusion, ctx) as [Circle, Point];

  if (!c_conc.equals(c_chord)) {
    return reasonApplicationFail("RADIUS_CHORD_CONV_CIRCLE_MISMATCH", {
      c_conc: c_conc.label,
      c_chord: c_chord.label,
    });
  }
  if (!s_bisected.equals(s_chord)) {
    return reasonApplicationFail("RADIUS_CHORD_CONV_CHORD_MISMATCH", {
      bisected: s_bisected.label,
      chord: s_chord.label,
    });
  }
  // The conclusion point must be an endpoint of the perpendicular bisector
  if (!s_perp.p1.equals(p_conc) && !s_perp.p2.equals(p_conc)) {
    return reasonApplicationFail("RADIUS_CHORD_CONV_POINT_NOT_ENDPOINT", {
      point: p_conc.label,
      bisector: s_perp.label,
    });
  }
  return reasonApplicationOk();
};

// con_inscribed_angs: inscribed_angle(a1, s) + inscribed_angle(a2, s) → con_ang(a1, a2)
// Both angles must be subtended by the same chord s.
export const con_inscribed_angs_check = (
  ins1: Stmt,
  ins2: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([ins1, ins2]);
  if (!dup.ok) return dup;

  const [a1, s1] = stmtMapper(ins1, ctx) as [Angle, Segment];
  const [a2, s2] = stmtMapper(ins2, ctx) as [Angle, Segment];
  const [ca1, ca2] = stmtMapper(conclusion, ctx) as [Angle, Angle];

  if (!s1.equals(s2)) {
    return reasonApplicationFail("CON_INSCRIBED_ANGS_CHORD_MISMATCH", {
      chord1: s1.label,
      chord2: s2.label,
    });
  }
  const anglesMatch =
    (ca1.equals(a1) && ca2.equals(a2)) || (ca1.equals(a2) && ca2.equals(a1));
  if (!anglesMatch) {
    return reasonApplicationFail("CON_INSCRIBED_ANGS_MISMATCH", {
      a1: a1.label,
      a2: a2.label,
    });
  }
  const reflexCheck = failReflexStatements(a1, a2);
  if (!reflexCheck.ok) return reflexCheck;
  return reasonApplicationOk();
};
