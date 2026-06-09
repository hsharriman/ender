import { Angle, ProofContent, Segment } from "geometry-object";
import { Quadrilateral } from "geometry-object/geometry/Quadrilateral";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper } from "./argMappers";
import {
  reasonApplicationFail,
  reasonApplicationOk,
} from "./triangleReasonResult";
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
    const [a1, a2] = conAngMapper(conclusion, ctx);
    return quadContainsAngle(quad, a1) && quadContainsAngle(quad, a2);
  }
  if (conclusion.function === "con_seg") {
    const [s1, s2] = conSegMapper(conclusion, ctx);
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

  const checkPair = (pairStmt: Stmt) => {
    const [p1, p2] = conSegMapper(pairStmt, ctx);
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
  }

  // special case: this reason expects the same pair of segments to be both congruent and para
  if (reasonName === "pgram_opp_side_para") {
    if (!pair2) {
      return reasonApplicationFail("PGRAM_MISSING_STMT_PAIR", {});
    }
    const [ps1, ps2] = conSegMapper(pair, ctx);
    const [ps3, ps4] = conSegMapper(pair2, ctx);
    if (!segmentPairsEqual([ps1, ps2], [ps3, ps4])) {
      return reasonApplicationFail("PGRAM_MISSING_STMT_PAIR", {
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
    const [p1, p2] = conAngMapper(pairStmt, ctx);
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
    const [ap1, ap2] = conAngMapper(pair, ctx);
    const [ap3, ap4] = conAngMapper(pair2, ctx);
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

export const pgram_consec_angs_check = (
  pgram: Stmt,
  sup1: Stmt,
  sup2: Stmt,
  ctx: ProofContent,
) => {
  const dup = checkDistinctDependencyStmts([pgram, sup1, sup2]);
  if (!dup.ok) return dup;
  const quad = ctx.getQuadrilateral(pgram.arguments[0].v);
  const [a1, a2] = conAngMapper(sup1, ctx);
  const [a3, a4] = conAngMapper(sup2, ctx);

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

export const quad_diag_con_check = (
  rect: Stmt,
  conSeg: Stmt,
  ctx: ProofContent,
  pgram_obj?: Stmt, // only required for the converse reason
) => {
  const dup = checkDistinctDependencyStmts(
    pgram_obj ? [pgram_obj, rect, conSeg] : [rect, conSeg],
  );
  if (!dup.ok) return dup;
  const r = ctx.getQuadrilateral(rect.arguments[0].v);
  const [s1, s2] = conSegMapper(conSeg, ctx);

  const reflexCheck = failReflexStatements(s1, s2);
  if (!reflexCheck.ok) return reflexCheck;

  if (!r.isDiagonal(s1) || !r.isDiagonal(s2)) {
    return reasonApplicationFail("NOT_DIAGONALS", {
      s1: s1.label,
      s2: s2.label,
    });
  }

  // if pgram_obj is provided, it must be the same quadrilateral as r
  if (pgram_obj) {
    const pgram = ctx.getQuadrilateral(pgram_obj.arguments[0].v);
    if (!pgram.equals(r)) {
      return reasonApplicationFail("NOT_SAME_QUADRILATERAL", {
        quad1: pgram.label,
        quad2: r.label,
      });
    }
  }
  return reasonApplicationOk();
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
  const [b1, b2, p1] = [
    ctx.getSegment(seg_b1.arguments[0].v),
    ctx.getSegment(seg_b1.arguments[1].v),
    ctx.getPoint(seg_b1.arguments[2].v),
  ];

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
