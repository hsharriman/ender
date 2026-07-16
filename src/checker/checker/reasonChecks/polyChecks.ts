import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { Quadrilateral } from "geometry-object/geometry/Quadrilateral";
import { Stmt } from "../../types/checkerTypes";
import {
  CheckerResult,
  reasonApplicationFail,
  reasonApplicationOk,
} from "./reasonResult";
import {
  anglePairsEqual,
  checkEqual,
  resolveAngleForProp,
  resolveSegmentForProp,
  segmentPairsEqual,
  stmtMapper,
} from "./utils";

const CONC_NOT_IN_QUAD = "conclusion_elements_not_in_quad";
const ANG_NOT_IN_RECT = "angle_not_contained_in_rect";
const RECT_PGRAM_DIFF = "rect_and_pgram_are_diff_quads";
const NOT_OPP_SIDES = "segs_not_opp_sides_of_quad";
const OPP_PAIR_MISMATCH = "opp_side_pair_must_match_in_both_stmts";
const SAME_OPP_PAIR = "both_pairs_are_the_same_opp_side_pair";
const NOT_OPP_ANGS = "angles_not_opp_angles_of_quad";
const SAME_ANG_PAIR = "both_pairs_are_the_same_angle_pair";
const NOT_CONSEC = "angles_not_consecutive_in_quad";
const NOT_BOTH_DIAG = "segs_not_both_diagonals_of_quad";
const NOT_DIAGONAL = "seg_not_a_diagonal_of_quad";
const DIFF_MIDPTS = "bisect_stmts_have_diff_midpts";
const DIFF_SEG_PAIRS = "bisect_stmts_have_diff_seg_pairs";
const DIFF_DIAGONAL = "segs_are_not_the_same_diagonal";
const NOT_IN_QUAD = "angle_or_seg_not_within_quad";
const NOT_CONSEC_SIDES = "segs_not_consecutive_sides_of_quad";
const NOT_BASE_ANGS = "angles_not_base_angle_pair_of_trap";
const TRAP_DIFF = "trap_and_isos_trap_are_diff_quads";
const DIFF_QUADS = "quad_stmts_refer_to_diff_quads";

const quadContainsAngle = (quad: Quadrilateral, a: Angle): boolean =>
  resolveAngleForProp(a, (name) => quad.a.some((qa) => qa.names.has(name))) !==
  null;

export const rectangle = (
  rect: Stmt,
  conclusion: Stmt,
  ctx: ProofContent,
): CheckerResult => {
  const quad = ctx.getQuadrilateral(rect.arguments[0].v);
  if (
    conclusion.function === "con_right" ||
    conclusion.function === "con_ang"
  ) {
    const [a1, a2] = stmtMapper(conclusion, ctx) as [Angle, Angle];
    if (quadContainsAngle(quad, a1) && quadContainsAngle(quad, a2))
      return reasonApplicationOk();
    return reasonApplicationFail(CONC_NOT_IN_QUAD);
  }
  if (conclusion.function === "con_seg") {
    const [s1, s2] = stmtMapper(conclusion, ctx) as [Segment, Segment];
    if (!quad.contains(s1) && !quad.contains(s2)) {
      return reasonApplicationFail(CONC_NOT_IN_QUAD);
    }
    if (!quad.isOppositeSides(s1, s2)) {
      return reasonApplicationFail(NOT_OPP_SIDES, {
        pair: [s1.label, s2.label],
      });
    }
    return reasonApplicationOk();
  }
  return reasonApplicationFail(CONC_NOT_IN_QUAD);
};

export const rect_pgram_ang_check = (
  rect: Stmt,
  pgram: Stmt,
  right: Stmt,
  ctx: ProofContent,
) => {
  const r = ctx.getQuadrilateral(rect.arguments[0].v);
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a] = stmtMapper(right, ctx) as [Angle];
  if (!quadContainsAngle(r, a)) {
    return reasonApplicationFail(ANG_NOT_IN_RECT, { angle: a.label });
  }
  const eq = checkEqual(quad, r, RECT_PGRAM_DIFF);
  if (!eq.ok) return eq;
  return reasonApplicationOk();
};

// used for both def_parallelogram, pgram_opp_sides and pgram_opp_sides_conv
// same check logic as the pgram angle check
export const def_pgram_side_check = (
  pair: Stmt,
  pgram: Stmt,
  ctx: ProofContent,
  pair2?: Stmt, // only the converse requires both pairs of segments
  reasonName?: string, // for specific pgram_opp_side_para check
) => {
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [ps1, ps2] = stmtMapper(pair, ctx) as [Segment, Segment];

  const checkPair = (pairStmt: Stmt) => {
    const [p1, p2] = stmtMapper(pairStmt, ctx) as [Segment, Segment];

    // check that p1 and p2 are opposite sides, and p1/p2 are not the same segments
    if (!quad.isOppositeSides(p1, p2)) {
      return reasonApplicationFail(NOT_OPP_SIDES, {
        pair: [p1.label, p2.label],
      });
    }
    return reasonApplicationOk();
  };

  const pair1Result = checkPair(pair);
  if (!pair1Result.ok) return pair1Result;

  if (pair2) {
    const pair2Result = checkPair(pair2);
    if (!pair2Result.ok) return pair2Result;
    const [ps3, ps4] = stmtMapper(pair2, ctx) as [Segment, Segment];
    // special case: this reason expects the same pair of segments to be both congruent and para
    if (reasonName === "pgram_opp_side_para") {
      if (!segmentPairsEqual([ps1, ps2], [ps3, ps4])) {
        return reasonApplicationFail(OPP_PAIR_MISMATCH, {
          pair1: [ps1.label, ps2.label],
          pair2: [ps3.label, ps4.label],
        });
      }
      return reasonApplicationOk();
      // otherwise, make sure that pair 1 and 2 are 2 diff sets of opposite sides
    } else if (segmentPairsEqual([ps1, ps2], [ps3, ps4])) {
      return reasonApplicationFail(SAME_OPP_PAIR, {
        pair1: [ps1.label, ps2.label],
        pair2: [ps3.label, ps4.label],
      });
    }
  }
  // both pairs are ok, so we can conclude the reason is valid
  return reasonApplicationOk();
};

// used for both pgram_opp_angs and pgram_opp_angs_conv
// same logic as the pgram side check
export const def_pgram_angle_check = (
  pair: Stmt,
  pgram: Stmt,
  ctx: ProofContent,
  pair2?: Stmt, // only converse requires both pairs of angles
) => {
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);

  const checkPair = (pairStmt: Stmt) => {
    const [p1, p2] = stmtMapper(pairStmt, ctx) as [Angle, Angle];
    // check that p1 and p2 are opposite angles
    if (!quad.isOppositeAngles(p1, p2)) {
      return reasonApplicationFail(NOT_OPP_ANGS, {
        pair: [p1.label, p2.label],
      });
    }
    return reasonApplicationOk();
  };

  const pair1Result = checkPair(pair);
  if (!pair1Result.ok) return pair1Result;
  if (pair2) {
    const pair2Result = checkPair(pair2);
    if (!pair2Result.ok) return pair2Result;
    const [ap1, ap2] = stmtMapper(pair, ctx) as [Angle, Angle];
    const [ap3, ap4] = stmtMapper(pair2, ctx) as [Angle, Angle];
    if (anglePairsEqual([ap1, ap2], [ap3, ap4])) {
      return reasonApplicationFail(SAME_ANG_PAIR, {
        pair1: [ap1.label, ap2.label],
        pair2: [ap3.label, ap4.label],
      });
    }
  }

  // both pairs are ok, so we can conclude the reason is valid
  return reasonApplicationOk();
};

export const pgram_consec_angs_conv_check = (
  pgram: Stmt,
  sup1: Stmt,
  sup2: Stmt,
  ctx: ProofContent,
) => {
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a1, a2] = stmtMapper(sup1, ctx) as [Angle, Angle];
  const [a3, a4] = stmtMapper(sup2, ctx) as [Angle, Angle];

  // between the 4 angles there should be 1 overlap and the
  // other 2 angles should be consecutive

  if (anglePairsEqual([a1, a2], [a3, a4])) {
    return reasonApplicationFail(SAME_ANG_PAIR, {
      pair1: [a1.label, a2.label],
      pair2: [a3.label, a4.label],
    });
  }
  // Find the shared angle (appears in both supplementary statements)
  const shared = [a1, a2].find((a) => a.equals(a3) || a.equals(a4));
  if (!shared) {
    return reasonApplicationFail(NOT_CONSEC, {
      pair1: [a1.label, a2.label],
      pair2: [a3.label, a4.label],
    });
  }
  // The "other" angle from each supp (not the shared one)
  const other1 = [a1, a2].find((a) => !a.equals(shared))!;
  const other2 = [a3, a4].find((a) => !a.equals(shared))!;
  // Consecutive angles of the shared angle must be exactly {other1, other2}
  const consecutive = quad.consecutiveAngles(shared.label);
  if (
    !consecutive ||
    !consecutive.some((a) => a.equals(other1)) ||
    !consecutive.some((a) => a.equals(other2))
  ) {
    return reasonApplicationFail(NOT_CONSEC, {
      pair1: [a1.label, a2.label],
      pair2: [a3.label, a4.label],
    });
  }
  return reasonApplicationOk();
};

export const pgram_consec_check = (
  pgram: Stmt,
  sup: Stmt,
  ctx: ProofContent,
) => {
  const r = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a1, a2] = stmtMapper(sup, ctx) as [Angle, Angle];

  // s1 and s2 must be consecutive sides on the rhombus
  if (!r.isConsecutive(a1, a2)) {
    return reasonApplicationFail(NOT_CONSEC, {
      a1: a1.label,
      a2: a2.label,
    });
  }
  // pgram must be the same as r
  return reasonApplicationOk();
};

// works for rectangle definition, converse, and trapezoid
export const quad_diag_con_check = (
  rect: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
  quad_obj?: Stmt, // only required for the converse reason
) => {
  const r = ctx.getQuadrilateral(rect.arguments[0].v);
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  if (
    !resolveSegmentForProp(s1, (s) => r.isDiagonal(s)) ||
    !resolveSegmentForProp(s2, (s) => r.isDiagonal(s))
  ) {
    return reasonApplicationFail(NOT_BOTH_DIAG, {
      s1: s1.label,
      s2: s2.label,
    });
  }

  // if pgram_obj is provided, it must be the same quadrilateral as r
  return quad_obj
    ? checkQuadrilateralCls(quad_obj, rect, ctx)
    : reasonApplicationOk();
};

export const pgram_diag_bisect_check = (
  pgram: Stmt,
  seg_b1: Stmt,
  ctx: ProofContent,
  seg_b2?: Stmt,
) => {
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [b1, b2, p1] = stmtMapper(seg_b1, ctx) as [Segment, Segment, Point];

  const validQuadCheck = (s1: Segment, s2: Segment) => {
    // s1,s2 must be exactly the diagonals — no parent/child substitutions
    if (!quad.isDiagonal(s1) || !quad.isDiagonal(s2)) {
      return reasonApplicationFail(NOT_DIAGONAL, {
        s1: s1.label,
        s2: s2.label,
      });
    }
    return reasonApplicationOk();
  };

  if (seg_b2) {
    const [c1, c2, p2] = [
      ctx.getSegment(seg_b2.arguments[0].v),
      ctx.getSegment(seg_b2.arguments[1].v),
      ctx.getPoint(seg_b2.arguments[2].v),
    ];
    // p1 and p2 should be the same,
    const eq = checkEqual(p1, p2, DIFF_MIDPTS);
    if (!eq.ok) {
      return eq;
    }
    // c1,c2 and b1,b2 should be the same.
    if (!segmentPairsEqual([c1, c2], [b1, b2])) {
      return reasonApplicationFail(DIFF_SEG_PAIRS, {
        s1: c1.label,
        s2: b1.label,
        s3: c2.label,
        s4: b2.label,
      });
    }
    return validQuadCheck(c1, c2);
  }
  return validQuadCheck(b1, b2);
};

// works for checking that diagonals of rhombus or kits are perpendicular
export const rhombus_kite_diag_check = (
  q: Stmt,
  perp: Stmt,
  ctx: ProofContent,
  pgram?: Stmt,
) => {
  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [s1, s2] = stmtMapper(perp, ctx) as [Segment, Segment, Point];

  // s1, s2 should be diagonals of the quadrilateral
  if (
    !resolveSegmentForProp(s1, (s) => r.isDiagonal(s)) ||
    !resolveSegmentForProp(s2, (s) => r.isDiagonal(s))
  ) {
    return reasonApplicationFail(NOT_DIAGONAL, {
      s1: s1.label,
      s2: s2.label,
    });
  }
  // if pgram is incl, then it must be the same as r
  return pgram ? checkQuadrilateralCls(pgram, q, ctx) : reasonApplicationOk();
};

export const rhombus_opp_bisect_check = (
  q: Stmt,
  ang_b1: Stmt,
  ctx: ProofContent,
  ang_b2?: Stmt,
  pgram?: Stmt,
) => {
  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [a1, s1] = stmtMapper(ang_b1, ctx) as [Angle, Segment];

  // each angle should be opposite on the quad, each segment should be the same and a diagonal
  if (ang_b2 && pgram) {
    const [a2, s2] = stmtMapper(ang_b2, ctx) as [Angle, Segment];
    const pg = ctx.getQuadrilateral(pgram.arguments[0].v);
    if (!r.isOppositeAngles(a1, a2)) {
      return reasonApplicationFail(NOT_OPP_ANGS, {
        pair: [a1.label, a2.label],
      });
    }
    if (!s1.equals(s2) || !resolveSegmentForProp(s2, (s) => r.isDiagonal(s))) {
      return reasonApplicationFail(DIFF_DIAGONAL, {
        s1: s1.label,
        s2: s2.label,
      });
    }
    // pgram must be the same as r
    return checkQuadrilateralCls(pgram, q, ctx);
  } else {
    // if only one angle/segment pair, just check that they are valid opposite angle and diagonal
    if (!r.contains(a1) || !resolveSegmentForProp(s1, (s) => r.isDiagonal(s))) {
      return reasonApplicationFail(NOT_IN_QUAD, {
        angle: a1.label,
        segment: s1.label,
      });
    }
  }
  return reasonApplicationOk();
};

export const rhombus_consec_check = (
  q: Stmt,
  pgram: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
) => {
  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  // s1 and s2 must be consecutive sides on the rhombus
  if (!r.isConsecutive(s1, s2)) {
    return reasonApplicationFail(NOT_CONSEC_SIDES, {
      s1: s1.label,
      s2: s2.label,
    });
  }
  // pgram must be the same as r
  return checkQuadrilateralCls(pgram, q, ctx);
};

export const kite_opp_ang_check = (
  kitePrem: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
) => {
  const [kite, a1, a2] = stmtMapper(kitePrem, ctx) as [
    Quadrilateral,
    Angle,
    Angle,
  ];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  // a1,a2 should equal c1,c2
  // a1,a2 represent the opposite congruent angles of the kite
  if (!anglePairsEqual([a1, a2], [c1, c2]) || !kite.isOppositeAngles(c1, c2)) {
    return reasonApplicationFail(NOT_OPP_ANGS, {
      pair1: [a1.label, a2.label],
      pair2: [c1.label, c2.label],
    });
  }
  return reasonApplicationOk();
};

// works for isosceles trapezoid base angle checks (and converse if isos not provided)
export const isos_trap_base_ang_check = (
  isos: Stmt,
  conAng: Stmt,
  ctx: ProofContent,
  trapPrem?: Stmt,
) => {
  const [isTrap] = stmtMapper(isos, ctx) as [Quadrilateral];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  // a1 and a2 should be a pair of base angles of the trapezoid
  if (!isTrap.isBaseAnglePair(a1, a2)) {
    return reasonApplicationFail(NOT_BASE_ANGS, {
      pair: [a1.label, a2.label],
    });
  }
  if (trapPrem) {
    const [tr] = stmtMapper(trapPrem, ctx) as [Quadrilateral];
    const eq = checkEqual(tr, isTrap, TRAP_DIFF);
    if (!eq.ok) {
      return eq;
    }
  }
  return reasonApplicationOk();
};

// works for translating one quadrilateral to another, like pgram to rectangle etc.
export const checkQuadrilateralCls = (
  quad: Stmt,
  quad2: Stmt,
  ctx: ProofContent,
) => {
  const q1 = ctx.getQuadrilateral(quad.arguments[0].v);
  const q2 = ctx.getQuadrilateral(quad2.arguments[0].v);
  const eq = checkEqual(q1, q2, DIFF_QUADS);
  if (!eq.ok) {
    return eq;
  }
  return reasonApplicationOk();
};
