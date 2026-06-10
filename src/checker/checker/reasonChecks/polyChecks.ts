import { Angle, Point, ProofContent, Segment } from "geometry-object";
import { Quadrilateral } from "geometry-object/geometry/Quadrilateral";
import { Stmt } from "../../types/checkerTypes";
import { stmtMapper } from "./argMappers";
import { reasonApplicationFail, reasonApplicationOk } from "./reasonResult";
import {
  anglePairsEqual,
  checkDistinctDependencyStmts,
  failReflexStatements,
  segmentPairsEqual,
} from "./utils";

// Checks whether the quad contains the angle, retrying with all of the
// angle's overlap-merged names when the direct label match fails.
const quadContainsAngle = (quad: Quadrilateral, a: Angle): boolean => {
  if (quad.contains(a)) return true;
  return (
    a.resolveLabel((name) => quad.a.some((qa) => qa.names.has(name))) !== null
  );
};

export const rectangle = (rect: Stmt, conclusion: Stmt, ctx: ProofContent) => {
  const quad = ctx.getQuadrilateral(rect.arguments[0].v);
  if (
    conclusion.function === "con_right" ||
    conclusion.function === "con_ang"
  ) {
    const [a1, a2] = stmtMapper(conclusion, ctx) as [Angle, Angle];
    return quadContainsAngle(quad, a1) && quadContainsAngle(quad, a2);
  }
  if (conclusion.function === "con_seg") {
    const [s1, s2] = stmtMapper(conclusion, ctx) as [Segment, Segment];
    return (
      !s1.equals(s2) &&
      quad.contains(s1) &&
      quad.contains(s2) &&
      !s1.contains(s2.p1) &&
      !s1.contains(s2.p2)
    );
  }

  return false;
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
  if (!r.contains(a)) {
    return reasonApplicationFail("NOT_RIGHT_ANGLE", {
      angle: a.label,
    });
  }
  if (!quad.equals(r)) {
    return reasonApplicationFail("RECT_PGRAM_MISMATCH", {
      rectangle: r.label,
      parallelogram: quad.label,
    });
  }
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
  const stmts = pair2 ? [pair, pair2, pgram] : [pair, pgram];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [ps1, ps2] = stmtMapper(pair, ctx) as [Segment, Segment];

  const checkPair = (pairStmt: Stmt) => {
    const [p1, p2] = stmtMapper(pairStmt, ctx) as [Segment, Segment];
    if (p1.equals(p2)) {
      return reasonApplicationFail("REFLEX_STMT_DEP", {
        pair: [p1.label, p2.label],
      });
    }
    // check that p1 and p2 are opposite sides, and p1/p2 are not the same segments
    if (!quad.isOppositeSides(p1, p2)) {
      return reasonApplicationFail("NOT_OPP_SIDES", {
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
    if (
      reasonName === "pgram_opp_side_para" &&
      !segmentPairsEqual([ps1, ps2], [ps3, ps4])
    ) {
      return reasonApplicationFail("PGRAM_MISSING_STMT_PAIR", {
        pair1: [ps1.label, ps2.label],
        pair2: [ps3.label, ps4.label],
      });
      // otherwise, make sure that pair 1 and 2 are 2 diff sets of opposite sides
    } else if (segmentPairsEqual([ps1, ps2], [ps3, ps4])) {
      return reasonApplicationFail("SAME_SEGMENT_PAIR", {
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
  const stmts = pair2 ? [pair, pair2, pgram] : [pair, pgram];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);

  const checkPair = (pairStmt: Stmt) => {
    const [p1, p2] = stmtMapper(pairStmt, ctx) as [Angle, Angle];
    const reflexCheck = failReflexStatements(p1, p2);
    if (!reflexCheck.ok) return reflexCheck;
    // check that p1 and p2 are opposite angles
    if (!quad.isOppositeAngles(p1, p2)) {
      return reasonApplicationFail("NOT_OPP_ANGLES", {
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
      return reasonApplicationFail("SAME_ANGLE_PAIR", {
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
  const dup = checkDistinctDependencyStmts([pgram, sup1, sup2]);
  if (!dup.ok) return dup;
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a1, a2] = stmtMapper(sup1, ctx) as [Angle, Angle];
  const [a3, a4] = stmtMapper(sup2, ctx) as [Angle, Angle];

  // between the 4 angles there should be 1 overlap and the
  // other 2 angles should be consecutive

  const reflexCheck1 = failReflexStatements(a1, a2);
  if (!reflexCheck1.ok) return reflexCheck1;
  const reflexCheck2 = failReflexStatements(a3, a4);
  if (!reflexCheck2.ok) return reflexCheck2;

  if (anglePairsEqual([a1, a2], [a3, a4])) {
    return reasonApplicationFail("SAME_ANGLE_PAIR", {
      pair1: [a1.label, a2.label],
      pair2: [a3.label, a4.label],
    });
  }
  const angleCheck = (a: Angle, o1: Angle, o2: Angle) => {
    const sharedAngle = a.equals(o1) || a.equals(o2) ? a : null;
    if (!sharedAngle) {
      return false;
    }
    const consecutive = quad.consecutiveAngles(sharedAngle.label);
    if (!consecutive) {
      return false;
    }
    return consecutive.every((ang) => ang.equals(o1) || ang.equals(o2));
  };
  if (!angleCheck(a1, a3, a4) || !angleCheck(a2, a3, a4)) {
    return reasonApplicationFail("NOT_CONSEC_ANGLES", {
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
  const dup = checkDistinctDependencyStmts([pgram, sup]);
  if (!dup.ok) return dup;
  const r = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a1, a2] = stmtMapper(sup, ctx) as [Angle, Angle];

  const reflexCheck = failReflexStatements(a1, a2);
  if (!reflexCheck.ok) return reflexCheck;

  // s1 and s2 must be consecutive sides on the rhombus
  if (!r.isConsecutive(a1, a2)) {
    return reasonApplicationFail("NOT_CONSEC_ANGS", {
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
  const dup = checkDistinctDependencyStmts(
    quad_obj ? [quad_obj, rect, conSeg] : [rect, conSeg],
  );
  if (!dup.ok) return dup;
  const r = ctx.getQuadrilateral(rect.arguments[0].v);
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  const reflexCheck = failReflexStatements(s1, s2);
  if (!reflexCheck.ok) return reflexCheck;

  if (!r.isDiagonal(s1) || !r.isDiagonal(s2)) {
    return reasonApplicationFail("NOT_DIAGONALS", {
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
  const stmts = seg_b2 ? [pgram, seg_b1, seg_b2] : [pgram, seg_b1];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [b1, b2, p1] = stmtMapper(seg_b1, ctx) as [Segment, Segment, Point];

  const validQuadCheck = (s1: Segment, s2: Segment) => {
    if (s1.equals(s2)) {
      return reasonApplicationFail("REFLEX_STMT_DEP", {
        pair: [s1.label, s2.label],
      });
    }
    // s1,s2 should be equal to diagonals of the quadrilateral
    if (!quad.isDiagonal(s1) || !quad.isDiagonal(s2)) {
      return reasonApplicationFail("NOT_DIAGONAL", {
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
    if (!p1.equals(p2)) {
      return reasonApplicationFail("NOT_SAME_POINT", {
        point1: p1.label,
        point2: p2.label,
      });
    }
    // c1,c2 and b1,b2 should be the same.
    if (!segmentPairsEqual([c1, c2], [b1, b2])) {
      return reasonApplicationFail("NOT_SAME_SEGMENTS", {
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
  const stmts = pgram ? [pgram, q, perp] : [q, perp];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;
  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [s1, s2] = stmtMapper(perp, ctx) as [Segment, Segment, Point];

  const reflexCheck = failReflexStatements(s1, s2);
  if (!reflexCheck.ok) return reflexCheck;

  // s1, s2 should be diagonals of the quadrilateral
  if (!r.isDiagonal(s1) || !r.isDiagonal(s2)) {
    return reasonApplicationFail("NOT_DIAGONAL", {
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
  const stmts = ang_b2 && pgram ? [pgram, q, ang_b1, ang_b2] : [q, ang_b1];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;

  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [a1, s1] = stmtMapper(ang_b1, ctx) as [Angle, Segment];

  // each angle should be opposite on the quad, each segment should be the same and a diagonal
  if (ang_b2 && pgram) {
    const [a2, s2] = stmtMapper(ang_b2, ctx) as [Angle, Segment];
    const pg = ctx.getQuadrilateral(pgram.arguments[0].v);
    if (!r.isOppositeAngles(a1, a2)) {
      return reasonApplicationFail("NOT_OPP_ANGLES", {
        pair: [a1.label, a2.label],
      });
    }
    if (!s1.equals(s2) || !r.isDiagonal(s2)) {
      return reasonApplicationFail("NOT_SAME_DIAGONAL", {
        s1: s1.label,
        s2: s2.label,
      });
    }
    // pgram must be the same as r
    return checkQuadrilateralCls(pgram, q, ctx);
  } else {
    // if only one angle/segment pair, just check that they are valid opposite angle and diagonal
    if (!r.contains(a1) || !r.isDiagonal(s1)) {
      return reasonApplicationFail("BISECT_NOT_WITHIN_QUAD", {
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
  const dup = checkDistinctDependencyStmts([q, pgram, conSeg]);
  if (!dup.ok) return dup;
  const r = ctx.getQuadrilateral(q.arguments[0].v);
  const [s1, s2] = stmtMapper(conSeg, ctx) as [Segment, Segment];

  const reflexCheck = failReflexStatements(s1, s2);
  if (!reflexCheck.ok) return reflexCheck;

  // s1 and s2 must be consecutive sides on the rhombus
  if (!r.isConsecutive(s1, s2)) {
    return reasonApplicationFail("NOT_CONSEC_SIDES", {
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
  const dup = checkDistinctDependencyStmts([kitePrem, conAng]);
  if (!dup.ok) return dup;
  const [kite, a1, a2] = stmtMapper(kitePrem, ctx) as [
    Quadrilateral,
    Angle,
    Angle,
  ];
  const [c1, c2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const reflexCheck1 = failReflexStatements(a1, a2);
  if (!reflexCheck1.ok) return reflexCheck1;
  const reflexCheck2 = failReflexStatements(c1, c2);
  if (!reflexCheck2.ok) return reflexCheck2;

  // a1,a2 should equal c1,c2
  // a1,a2 represent the opposite congruent angles of the kite
  if (!anglePairsEqual([a1, a2], [c1, c2]) || !kite.isOppositeAngles(c1, c2)) {
    return reasonApplicationFail("NOT_OPP_ANGLES", {
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
  const stmts = trapPrem ? [trapPrem, conAng, isos] : [isos, conAng];
  const dup = checkDistinctDependencyStmts(stmts);
  if (!dup.ok) return dup;
  const [isTrap] = stmtMapper(isos, ctx) as [Quadrilateral];
  const [a1, a2] = stmtMapper(conAng, ctx) as [Angle, Angle];

  const reflexCheck = failReflexStatements(a1, a2);
  if (!reflexCheck.ok) return reflexCheck;

  // a1 and a2 should be a pair of base angles of the trapezoid
  if (!isTrap.isBaseAnglePair(a1, a2)) {
    return reasonApplicationFail("NOT_BASE_ANGLE_PAIR", {
      pair: [a1.label, a2.label],
    });
  }
  if (trapPrem) {
    const [tr] = stmtMapper(trapPrem, ctx) as [Quadrilateral];
    if (!tr.equals(isTrap)) {
      return reasonApplicationFail("TRAP_ISOS_MISMATCH", {
        trap: tr.label,
        isos_trap: isTrap.label,
      });
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
  if (!q1.equals(q2)) {
    return reasonApplicationFail("NOT_SAME_QUADRILATERAL", {
      quad1: q1.label,
      quad2: q2.label,
    });
  }
  return reasonApplicationOk();
};
