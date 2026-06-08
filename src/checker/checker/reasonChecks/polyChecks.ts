import { Angle, ProofContent } from "geometry-object";
import { Quadrilateral } from "geometry-object/geometry/Quadrilateral";
import { Stmt } from "../../types/checkerTypes";
import { conAngMapper, conSegMapper } from "./argMappers";
import {
  reasonApplicationFail,
  reasonApplicationOk,
} from "./triangleReasonResult";
import { checkDistinctDependencyStmts } from "./utils";

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
    const pair1 = new Set(conSegMapper(pair, ctx));
    if (!pair2) {
      return reasonApplicationFail("PGRAM_MISSING_STMT_PAIR", {});
    }
    const [ps3, ps4] = conSegMapper(pair2, ctx);
    if (!pair1.has(ps3) || !pair1.has(ps4)) {
      return reasonApplicationFail("PGRAM_MISSING_STMT_PAIR", {
        pair1: Array.from(pair1).map((s) => s.label),
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
    if (p1.equals(p2)) {
      return reasonApplicationFail("REFLEX_STMT_DEP", {
        pair: [p1.label, p2.label],
      });
    }
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
  }

  // both pairs are ok, so we can conclude the reason is valid
  return reasonApplicationOk();
};

export const pgram_consec_angs = (
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

  
};
