import { getGeometricObject } from "checker/utils/utils";
import { Angle, ProofContent, Segment } from "../../geometry-object";
import {
  ParseDiagramStmt,
  ProofGraph,
  ProofStep,
  ReasonDefinition,
} from "../types/checkerTypes";
import {
  con_supp_comp_diff_angles,
  con_supp_comp_same_angle,
  def_ang_bisect,
  defConRight,
  linear_pair,
  reflex_a,
  vert_ang,
} from "./reasonChecks/angleChecks";
import {
  altext,
  altint,
  corresp_ang,
  intersect_seg,
  midpt,
  perp,
  perp_bisector,
  perp_con_ang,
  reflex_s,
  sameside,
} from "./reasonChecks/lineChecks";
import { def_pgram_side_check, rectangle } from "./reasonChecks/polyChecks";
import {
  checkAa,
  checkAas,
  checkAsa,
  checkBaseAngle,
  checkConTri,
  checkCpctc,
  checkEquiangular,
  checkEquilateral,
  checkIsosceles,
  checkRhl,
  checkSas,
  checkSss,
  checkThirdAngle,
  equilateralEquiangular,
} from "./reasonChecks/triangleChecks";
import { ReasonApplicationFailure } from "./reasonChecks/triangleReasonResult";
import { validateGivenProofStep } from "./validators";

const addStmtArgMismatchError = (
  errors: ProofStep["errors"],
  reason: string,
  failure: ReasonApplicationFailure,
) => {
  errors.push({
    type: "stmt_arg_mismatch",
    data: {
      reason,
      code: failure.code,
      ...(failure.details ?? {}),
    },
  });
};

const failStmtArgMismatch = (
  currStep: ProofStep,
  reason: string,
  code: string,
  details?: Record<string, unknown>,
): false => {
  currStep.errors.push({
    type: "stmt_arg_mismatch",
    data: {
      reason,
      code,
      ...(details ?? {}),
    },
  });
  return false;
};

// Check if reason is applied correctly using reason checker methods
export const checkReasonApplication = (
  currStep: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph,
  ctx: ProofContent,
): boolean => {
  const reason = currStep.reason!;
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    return false;
  }

  try {
    const stmt = currStep.statement!;

    // Call the appropriate reason checker method
    switch (reason.function) {
      case "reflex_s":
        return (
          reflex_s(
            getGeometricObject(stmt.arguments[0], ctx) as Segment,
            getGeometricObject(stmt.arguments[1], ctx) as Segment,
          ) ||
          failStmtArgMismatch(currStep, reason.function, "REFLEX_S_MISMATCH")
        );

      case "reflex_a":
        return (
          reflex_a(
            getGeometricObject(stmt.arguments[0], ctx) as Angle,
            getGeometricObject(stmt.arguments[1], ctx) as Angle,
          ) ||
          failStmtArgMismatch(currStep, reason.function, "REFLEX_A_MISMATCH")
        );

      case "altint": {
        const para_alt = getDepStmt(reason.arguments[0], proofGraph)!;
        const altintMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => altint(stmt, d.statement, para_alt, ctx));
        if (altintMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "ALTINT_NO_MATCH",
          );
        currStep.diagramDeps = altintMatches;
        return true;
      }
      case "altint_conv": {
        const conAng_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        const altintConvMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => altint(conAng_conv, d.statement, stmt, ctx));
        if (altintConvMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "ALTINT_CONV_NO_MATCH",
          );
        currStep.diagramDeps = altintConvMatches;
        return true;
      }
      case "def_ang_bisect":
        const bisect_bisect = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          def_ang_bisect(stmt, bisect_bisect, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "DEF_ANG_BISECT_MISMATCH",
          )
        );
      case "ang_bisect_conv":
        const conAng_bisect_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          def_ang_bisect(conAng_bisect_conv, stmt, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "ANG_BISECT_CONV_MISMATCH",
          )
        );

      case "sas": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSas(stmt, s1, a, s2, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "sss": {
        const s1_sss = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2_sss = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3_sss = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSss(stmt, s1_sss, s2_sss, s3_sss, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "cpctc": {
        const t_cong = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkCpctc(t_cong, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "aas": {
        const a1_aas = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2_aas = getDepStmt(reason.arguments[1], proofGraph)!;
        const s_aas = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkAas(stmt, a1_aas, a2_aas, s_aas, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "asa": {
        const a1_asa = getDepStmt(reason.arguments[0], proofGraph)!;
        const s_asa = getDepStmt(reason.arguments[1], proofGraph)!;
        const a2_asa = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkAsa(stmt, a1_asa, s_asa, a2_asa, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "rhl": {
        const right_rhl = getDepStmt(reason.arguments[0], proofGraph)!;
        const s1_rhl = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2_rhl = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkRhl(stmt, right_rhl, s1_rhl, s2_rhl, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "def_isosceles": {
        const conSeg_isos = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkIsosceles(conSeg_isos, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "def_midpt":
        const midPt_midpt = getDepStmt(reason.arguments[0], proofGraph)!;
        return midpt(stmt, midPt_midpt, ctx)
          ? true
          : failStmtArgMismatch(currStep, reason.function, "MIDPT_MISMATCH");
      case "midpt_conv":
        const conSeg_midpt_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          midpt(conSeg_midpt_conv, stmt, ctx) ||
          failStmtArgMismatch(currStep, reason.function, "MIDPT_CONV_MISMATCH")
        );

      case "def_perp": {
        const right_perp = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          perp(right_perp, stmt, ctx) ||
          failStmtArgMismatch(currStep, reason.function, "PERP_NO_MATCH")
        );
      }
      case "rectangle":
        const conSeg_rectangle = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          rectangle(conSeg_rectangle, stmt, ctx) ||
          failStmtArgMismatch(currStep, reason.function, "RECTANGLE_MISMATCH")
        );
      case "rectangle_pgram":
        // TODO implement
        return true;
      case "def_parallelogram":
        const para1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const para2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = def_pgram_side_check(para1, stmt, ctx, para2);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      case "intersect_seg":
        const intersect_on1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const intersect_on2 = getDepStmt(reason.arguments[1], proofGraph)!;
        return (
          intersect_seg(intersect_on1, intersect_on2, stmt, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "INTERSECT_SEG_MISMATCH",
          )
        );
      case "def_con_right": {
        const right1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const right2 = getDepStmt(reason.arguments[1], proofGraph)!;
        return (
          defConRight(right1, right2, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "DEF_CON_RIGHT_MISMATCH",
          )
        );
      }
      case "vert_ang":
        const vertAngIntersectMatches = diagramPremisesByFunction(
          proofGraph,
          "intersect_seg",
        ).filter((d) => vert_ang(d.statement, stmt, ctx));
        if (vertAngIntersectMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "VERT_ANG_NO_MATCH",
          );
        currStep.diagramDeps = vertAngIntersectMatches;
        return true;
      case "sameside_ang": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => sameside(stmt, d.statement, para, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "sameside_ang_conv": {
        const sup_ang = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => sameside(sup_ang, d.statement, stmt, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "corresp_ang": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => corresp_ang(stmt, d.statement, para, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "corresp_ang_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => corresp_ang(conAng, d.statement, stmt, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "altext": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => altext(stmt, d.statement, para, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "altext_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const samesideMatches = diagramPremisesByFunction(
          proofGraph,
          "transversal",
        ).filter((d) => altext(conAng, d.statement, stmt, ctx));
        if (samesideMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "SAMESIDE_ANG_NO_MATCH",
          );
        currStep.diagramDeps = samesideMatches;
        return true;
      }
      case "perp_con_ang": {
        const perp = getDepStmt(reason.arguments[0], proofGraph)!;
        if (!perp_con_ang(perp, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "PERP_CON_ANG_MISMATCH",
          );
        return true;
      }
      case "perp_bisector": {
        const perp = getDepStmt(reason.arguments[0], proofGraph)!;
        const midpt = getDepStmt(reason.arguments[1], proofGraph)!;
        if (!perp_bisector(perp, midpt, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "PERP_BISECTOR_MISMATCH",
          );
        return true;
      }
      case "con_supplements_same": {
        const sup1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const sup2 = getDepStmt(reason.arguments[1], proofGraph)!;
        if (!con_supp_comp_same_angle(sup1, sup2, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "CON_SUPPLEMENTS_MISMATCH",
          );
        return true;
      }
      case "con_complements_same": {
        const comp1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const comp2 = getDepStmt(reason.arguments[1], proofGraph)!;
        if (!con_supp_comp_same_angle(comp1, comp2, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "CON_COMPLEMENTS_MISMATCH",
          );
        return true;
      }
      case "con_supplements": {
        const sup1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const sup2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const conAng = getDepStmt(reason.arguments[2], proofGraph)!;
        if (!con_supp_comp_diff_angles(sup1, sup2, conAng, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "CON_SUPPLEMENTS_MISMATCH",
          );
        return true;
      }
      case "con_complements": {
        const comp1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const comp2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const conAng = getDepStmt(reason.arguments[2], proofGraph)!;
        if (!con_supp_comp_diff_angles(comp1, comp2, conAng, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "CON_COMPLEMENTS_MISMATCH",
          );
        return true;
      }
      case "def_linear_pair": {
        const linearPair = getDepStmt(reason.arguments[0], proofGraph)!;
        if (!linear_pair(linearPair, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "DEF_LINEAR_PAIR_MISMATCH",
          );
        return true;
      }
      case "linear_pair_conv": {
        const supplementary = getDepStmt(reason.arguments[0], proofGraph)!;
        if (!linear_pair(supplementary, stmt, ctx))
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "LINEAR_PAIR_CONV_MISMATCH",
          );
        return true;
      }
      case "def_con_tri": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const a1 = getDepStmt(reason.arguments[3], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[4], proofGraph)!;
        const a3 = getDepStmt(reason.arguments[5], proofGraph)!;
        const r = checkConTri(stmt, s1, s2, s3, a1, a2, a3, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "third_angle": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkThirdAngle(a1, a2, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "base_angle": {
        const conSeg = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkBaseAngle(conSeg, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "base_angle_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkBaseAngle(stmt, conAng, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "equilat_equiang": {
        const equilat = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = equilateralEquiangular(equilat, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "equiang_equilat": {
        const equiang = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = equilateralEquiangular(stmt, equiang, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "def_equiangular": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const a3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkEquiangular(a1, a2, a3, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "def_equilateral": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkEquilateral(s1, s2, s3, stmt, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "sas_sim": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSas(stmt, s1, a, s2, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }

      case "sss_sim": {
        const s1_sss = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2_sss = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3_sss = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSss(stmt, s1_sss, s2_sss, s3_sss, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "aa_sim": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkAa(stmt, a1, a2, ctx);
        if (!r.ok) {
          addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
          return false;
        }
        return true;
      }
      case "given":
        return validateGivenProofStep(currStep, proofGraph);

      // TODO implement
      case "circumcenter":
      case "incenter":
      // TODO implement pgram reasons
      case "pgram_opp_sides":
      case "pgram_opp_sides_conv":
      case "pgram_opp_angs":
      case "pgram_opp_angs_conv":
      case "pgram_consec_angs":
      case "pgram_consec_angs_conv":
      case "pgram_diag_bisect":
      case "pgram_diag_bisect_conv":
      case "pgram_opp_side_para":
      case "rhombus_pgram":
      case "rectangle_diag_con":
        return true;

      default:
        // For other reasons, we'll return true for now (syntax check passed)
        return true;
    }
  } catch {
    return failStmtArgMismatch(
      currStep,
      reason.function,
      "REASON_APPLICATION_EXCEPTION",
    );
  }
};

const getDepStmt = (idx: string, proofGraph: ProofGraph) => {
  const diagramDep = proofGraph.diagramPremises.get(idx);
  if (diagramDep) return diagramDep.statement;
  return proofGraph.nodes.get(idx)?.statement;
};

const diagramPremisesByFunction = (
  proofGraph: ProofGraph,
  fn: string,
): ParseDiagramStmt[] => {
  return Array.from(proofGraph.diagramPremises.values()).filter(
    (d) => d.statement.function === fn,
  );
};
