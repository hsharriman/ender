import { Angle, Circle, Point, ProofContent, Segment } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import { reasonApplicationFail, reasonApplicationOk } from "./reasonResult";
import { checkDistinctDependencyStmts, failReflexStatements, resolveSegmentForProp } from "./utils";

const DIFF_CIRCLES = "tangent_and_radius_on_diff_circles";
const DIFF_TAN_PTS = "tangent_and_radius_have_diff_tangency_pts";
const BAD_INT_PT = "perp_intersect_pt_doesnt_match_tangency_pt";
const TAN_NOT_PERP = "tangent_seg_not_in_perp_stmt";
const NOT_RADIUS = "other_perp_seg_not_a_radius_to_tangency_pt";
const TAN_DIFF_CIRCLES = "tangent_stmts_on_diff_circles";
const SAME_TAN_PT = "tangent_stmts_share_same_tangency_pt";
const SEG_NO_MATCH = "con_segs_dont_match_tangent_segs";
const NO_EXT_PT = "tangent_segs_have_no_common_ext_pt";
const RAD_CHORD_DIFF = "radius_and_chord_on_diff_circles";
const NO_CHORD_IN_PERP = "neither_perp_seg_matches_the_chord";
const NO_CENTER = "radius_dir_seg_doesnt_contain_circle_center";
const BAD_BISECT_SEGS = "conclusion_segs_dont_match_chord_and_radius_dir_segs";
const BAD_BISECT_MIDPT = "conclusion_midpt_doesnt_match_perp_intersect_pt";
const CONC_DIFF_CIRCLES = "conclusion_and_chord_on_diff_circles";
const NOT_CHORD = "bisected_seg_not_the_chord";
const PT_NOT_ENDPOINT = "conclusion_pt_not_endpoint_of_perp_bisector";
const DIFF_CHORDS = "inscribed_angles_subtended_by_diff_chords";
const ANG_NO_MATCH = "inscribed_angles_dont_match_con_ang_conclusion";

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
    return reasonApplicationFail(DIFF_CIRCLES, {
      circle1: circle_tan.label,
      circle2: circle_rad.label,
    });
  }
  if (!p_tan.equals(p_rad)) {
    return reasonApplicationFail(DIFF_TAN_PTS, {
      p_tan: p_tan.label,
      p_rad: p_rad.label,
    });
  }
  if (!p_int || !p_int.equals(p_tan)) {
    return reasonApplicationFail(BAD_INT_PT, {
      p_int: p_int?.label,
      p_tan: p_tan.label,
    });
  }
  const tanIsS1 = resolveSegmentForProp(s_tan, (s) => s1.equals(s)) !== null;
  const tanIsS2 = resolveSegmentForProp(s_tan, (s) => s2.equals(s)) !== null;
  if (!tanIsS1 && !tanIsS2) {
    return reasonApplicationFail(TAN_NOT_PERP, { tangent: s_tan.label });
  }
  const s_radius = tanIsS1 ? s2 : s1;
  if (!isRadiusSegment(s_radius, circle_tan, p_tan)) {
    return reasonApplicationFail(NOT_RADIUS, {
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
    return reasonApplicationFail(TAN_DIFF_CIRCLES, {
      c1: c1.label,
      c2: c2.label,
    });
  }
  if (p1.equals(p2)) {
    return reasonApplicationFail(SAME_TAN_PT, { p: p1.label });
  }
  const segPairMatches =
    (cs1.equals(s1) && cs2.equals(s2)) || (cs1.equals(s2) && cs2.equals(s1));
  if (!segPairMatches) {
    return reasonApplicationFail(SEG_NO_MATCH, { s1: s1.label, s2: s2.label });
  }
  // Find the non-tangency endpoint of each segment (the shared external point)
  const ext1 = s1.p1.equals(p1) ? s1.p2 : s1.p1;
  const ext2 = s2.p1.equals(p2) ? s2.p2 : s2.p1;
  if (!ext1.equals(ext2)) {
    return reasonApplicationFail(NO_EXT_PT, {
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
    return reasonApplicationFail(RAD_CHORD_DIFF, {
      c_rad: c_rad.label,
      c_chord: c_chord.label,
    });
  }
  // One of the perp segments must be the chord
  const chordIsFirst = s_rad.equals(s_chord);
  const chordIsSecond = s_ch.equals(s_chord);
  if (!chordIsFirst && !chordIsSecond) {
    return reasonApplicationFail(NO_CHORD_IN_PERP, { chord: s_chord.label });
  }
  const s_perpRad = chordIsFirst ? s_ch : s_rad;
  const s_perpChord = chordIsFirst ? s_rad : s_ch;
  // The non-chord perp segment must contain the circle center
  if (!s_perpRad.contains(c_rad.center)) {
    return reasonApplicationFail(NO_CENTER, {
      segment: s_perpRad.label,
      center: c_rad.center.label,
    });
  }
  // Conclusion must reference both the chord and the radius-direction segment
  const hasChord = cs1.equals(s_perpChord) || cs2.equals(s_perpChord);
  const hasRad = cs1.equals(s_perpRad) || cs2.equals(s_perpRad);
  if (!hasChord || !hasRad) {
    return reasonApplicationFail(BAD_BISECT_SEGS, {
      chord: s_perpChord.label,
      radius: s_perpRad.label,
    });
  }
  if (!cp.equals(p_int)) {
    return reasonApplicationFail(BAD_BISECT_MIDPT, {
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
    return reasonApplicationFail(CONC_DIFF_CIRCLES, {
      c_conc: c_conc.label,
      c_chord: c_chord.label,
    });
  }
  if (!s_bisected.equals(s_chord)) {
    return reasonApplicationFail(NOT_CHORD, {
      bisected: s_bisected.label,
      chord: s_chord.label,
    });
  }
  // The conclusion point must be an endpoint of the perpendicular bisector
  if (!s_perp.p1.equals(p_conc) && !s_perp.p2.equals(p_conc)) {
    return reasonApplicationFail(PT_NOT_ENDPOINT, {
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
    return reasonApplicationFail(DIFF_CHORDS, {
      chord1: s1.label,
      chord2: s2.label,
    });
  }
  const anglesMatch =
    (ca1.equals(a1) && ca2.equals(a2)) || (ca1.equals(a2) && ca2.equals(a1));
  if (!anglesMatch) {
    return reasonApplicationFail(ANG_NO_MATCH, { a1: a1.label, a2: a2.label });
  }
  const reflexCheck = failReflexStatements(a1, a2);
  if (!reflexCheck.ok) return reflexCheck;
  return reasonApplicationOk();
};
