import { ProofContent } from "../../geometry-object";
import {
  ParseDiagramStmt,
  ProofGraph,
  ProofStep,
  Reason,
  ReasonDefinition,
} from "../types/checkerTypes";
import { getGeometricObject } from "../utils/utils";
import {
  check_vert_ang,
  con_supp_comp_diff_angles,
  con_supp_comp_same_angle,
  def_ang_bisect,
  defConRight,
  linear_pair,
} from "./reasonChecks/angleChecks";
import {
  checkTangentPerpRelationship,
  con_inscribed_angs_check,
  con_tangents_ext_check,
  radius_chord_bisect_check,
  radius_chord_bisect_conv_check,
} from "./reasonChecks/circleChecks";
import {
  altext,
  altint,
  corresp_ang,
  intersect_seg,
  midpt,
  perp,
  perp_bisector,
  perp_con_ang,
  sameside,
} from "./reasonChecks/lineChecks";
import {
  checkQuadrilateralCls,
  def_pgram_angle_check,
  def_pgram_side_check,
  isos_trap_base_ang_check,
  kite_opp_ang_check,
  pgram_consec_angs_conv_check,
  pgram_consec_check,
  pgram_diag_bisect_check,
  quad_diag_con_check,
  rect_pgram_ang_check,
  rectangle,
  rhombus_consec_check,
  rhombus_kite_diag_check,
  rhombus_opp_bisect_check,
} from "./reasonChecks/polyChecks";
import {
  CheckerResult,
  DiagramResult,
  ErrorDetails,
} from "./reasonChecks/reasonResult";
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
import { checkEqual, checkTransitive } from "./reasonChecks/utils";
import { validateGivenProofStep } from "./validators";

const addStmtArgMismatchError = (
  errors: ProofStep["errors"],
  reason: string,
  failure: ErrorDetails,
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
      case "reflex": {
        const r = checkEqual(
          getGeometricObject(stmt.arguments[0], ctx),
          getGeometricObject(stmt.arguments[1], ctx),
        );
        return floatReasonResult(r, currStep, reason);
      }
      case "altint": {
        const para_alt = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = altint(
          stmt,
          para_alt,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "altint_conv": {
        const conAng_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = altint(
          conAng_conv,
          stmt,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "def_ang_bisect": {
        const bisect_bisect = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = def_ang_bisect(stmt, bisect_bisect, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "ang_bisect_conv": {
        const conAng_bisect_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = def_ang_bisect(conAng_bisect_conv, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "sas": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSas(stmt, s1, a, s2, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "sss": {
        const s1_sss = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2_sss = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3_sss = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSss(stmt, s1_sss, s2_sss, s3_sss, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "cpctc": {
        const t_cong = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkCpctc(t_cong, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "aas": {
        const a1_aas = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2_aas = getDepStmt(reason.arguments[1], proofGraph)!;
        const s_aas = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkAas(stmt, a1_aas, a2_aas, s_aas, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "asa": {
        const a1_asa = getDepStmt(reason.arguments[0], proofGraph)!;
        const s_asa = getDepStmt(reason.arguments[1], proofGraph)!;
        const a2_asa = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkAsa(stmt, a1_asa, s_asa, a2_asa, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhl": {
        const right_rhl = getDepStmt(reason.arguments[0], proofGraph)!;
        const s1_rhl = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2_rhl = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkRhl(stmt, right_rhl, s1_rhl, s2_rhl, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_isosceles": {
        const conSeg_isos = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkIsosceles(conSeg_isos, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_midpt": {
        const midPt_midpt = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = midpt(stmt, midPt_midpt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "midpt_conv": {
        const conSeg_midpt_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = midpt(conSeg_midpt_conv, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_perp": {
        const right_perp = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = perp(right_perp, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rectangle": {
        const conSeg_rectangle = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = rectangle(conSeg_rectangle, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_parallelogram": {
        const para1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const para2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = def_pgram_side_check(para1, stmt, ctx, para2);
        return floatReasonResult(r, currStep, reason);
      }

      case "intersect_seg": {
        const intersect_on1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const intersect_on2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = intersect_seg(intersect_on1, intersect_on2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_con_right": {
        const right1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const right2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = defConRight(right1, right2, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "vert_ang": {
        const r = check_vert_ang(
          stmt,
          diagramPremisesByFunction(proofGraph, "intersect_seg"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "sameside_ang": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = sameside(
          stmt,
          para,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "sameside_ang_conv": {
        const sup_ang = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = sameside(
          sup_ang,
          stmt,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "corresp_ang": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = corresp_ang(
          stmt,
          para,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "corresp_ang_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = corresp_ang(
          conAng,
          stmt,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "altext": {
        const para = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = altext(
          stmt,
          para,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "altext_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = altext(
          conAng,
          stmt,
          diagramPremisesByFunction(proofGraph, "transversal"),
          ctx,
        );
        return floatDiagramResult(r, currStep, reason);
      }

      case "perp_con_ang": {
        const perpDep = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = perp_con_ang(perpDep, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "perp_bisector": {
        const perpDep = getDepStmt(reason.arguments[0], proofGraph)!;
        const midptDep = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = perp_bisector(perpDep, midptDep, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "con_supplements_same": {
        const sup1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const sup2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = con_supp_comp_same_angle(sup1, sup2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "con_complements_same": {
        const comp1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const comp2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = con_supp_comp_same_angle(comp1, comp2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "con_supplements": {
        const sup1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const sup2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const conAng = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = con_supp_comp_diff_angles(sup1, sup2, conAng, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "con_complements": {
        const comp1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const comp2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const conAng = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = con_supp_comp_diff_angles(comp1, comp2, conAng, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_linear_pair": {
        const linearPair = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = linear_pair(linearPair, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "linear_pair_conv": {
        const supplementary = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = linear_pair(supplementary, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_con_tri": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const a1 = getDepStmt(reason.arguments[3], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[4], proofGraph)!;
        const a3 = getDepStmt(reason.arguments[5], proofGraph)!;
        const r = checkConTri(stmt, s1, s2, s3, a1, a2, a3, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "third_angle": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkThirdAngle(a1, a2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "base_angle": {
        const conSeg = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkBaseAngle(conSeg, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "base_angle_conv": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkBaseAngle(stmt, conAng, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "equilat_equiang": {
        const equilat = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = equilateralEquiangular(equilat, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "equiang_equilat": {
        const equiang = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = equilateralEquiangular(stmt, equiang, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_equiangular": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const a3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkEquiangular(a1, a2, a3, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "def_equilateral": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkEquilateral(s1, s2, s3, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "sas_sim": {
        const s1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a = getDepStmt(reason.arguments[1], proofGraph)!;
        const s2 = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSas(stmt, s1, a, s2, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "sss_sim": {
        const s1_sss = getDepStmt(reason.arguments[0], proofGraph)!;
        const s2_sss = getDepStmt(reason.arguments[1], proofGraph)!;
        const s3_sss = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = checkSss(stmt, s1_sss, s2_sss, s3_sss, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "aa_sim": {
        const a1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const a2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkAa(stmt, a1, a2, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "given": {
        return validateGivenProofStep(currStep, proofGraph);
      }

      case "pgram_opp_sides": {
        const pgram = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = def_pgram_side_check(stmt, pgram, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_opp_sides_conv": {
        const con1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const con2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = def_pgram_side_check(con1, stmt, ctx, con2);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_opp_angs": {
        const pgram = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = def_pgram_angle_check(stmt, pgram, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_opp_angs_conv": {
        const con1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const con2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = def_pgram_angle_check(con1, stmt, ctx, con2);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_consec_angs": {
        const pgram = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = pgram_consec_check(pgram, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_consec_angs_conv": {
        const sup1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const sup2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = pgram_consec_angs_conv_check(stmt, sup1, sup2, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_diag_bisect": {
        const pgram = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = pgram_diag_bisect_check(pgram, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_diag_bisect_conv": {
        const seg_b1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const seg_b2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = pgram_diag_bisect_check(stmt, seg_b1, ctx, seg_b2);
        return floatReasonResult(r, currStep, reason);
      }

      case "pgram_opp_side_para": {
        const conSeg = getDepStmt(reason.arguments[0], proofGraph)!;
        const para = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = def_pgram_side_check(
          conSeg,
          stmt,
          ctx,
          para,
          reason.function,
        );
        return floatReasonResult(r, currStep, reason);
      }

      case "rectangle_pgram": {
        const rect = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkQuadrilateralCls(rect, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_pgram": {
        const rhombus = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = checkQuadrilateralCls(rhombus, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rect_diag_con": {
        const rect = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = quad_diag_con_check(rect, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rect_diag_con_conv": {
        const conSeg = getDepStmt(reason.arguments[0], proofGraph)!;
        const pgram = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = quad_diag_con_check(stmt, conSeg, ctx, pgram);
        return floatReasonResult(r, currStep, reason);
      }

      case "rect_pgram_ang": {
        const right = getDepStmt(reason.arguments[0], proofGraph)!;
        const pgram = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = rect_pgram_ang_check(stmt, pgram, right, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_diag_perp": {
        const rhombus = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = rhombus_kite_diag_check(rhombus, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_diag_perp_conv": {
        const perpDep = getDepStmt(reason.arguments[0], proofGraph)!;
        const pgram = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = rhombus_kite_diag_check(stmt, perpDep, ctx, pgram);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_opp_bisect_conv": {
        const bisect = getDepStmt(reason.arguments[0], proofGraph)!;
        const bisect2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const pgram = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = rhombus_opp_bisect_check(stmt, bisect, ctx, bisect2, pgram);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_opp_bisect": {
        const rhombus = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = rhombus_opp_bisect_check(rhombus, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "rhombus_consec_sides": {
        const pgram = getDepStmt(reason.arguments[0], proofGraph)!;
        const conSeg = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = rhombus_consec_check(stmt, pgram, conSeg, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "kite_diag_perp": {
        const kite = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = rhombus_kite_diag_check(kite, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "kite_opp_con_ang": {
        const kite = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = kite_opp_ang_check(kite, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "isos_trap_base_angs": {
        const conAng = getDepStmt(reason.arguments[0], proofGraph)!;
        const trap = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = isos_trap_base_ang_check(stmt, conAng, ctx, trap);
        return floatReasonResult(r, currStep, reason);
      }

      case "isos_trap_base_angs_conv": {
        const isos = getDepStmt(reason.arguments[0], proofGraph)!;
        const r = isos_trap_base_ang_check(isos, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "isos_trap_con_diags": {
        const conSeg = getDepStmt(reason.arguments[0], proofGraph)!;
        const trap = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = quad_diag_con_check(stmt, conSeg, ctx, trap);
        return floatReasonResult(r, currStep, reason);
      }

      case "tangent_perp": {
        const tanStmt = getDepStmt(reason.arguments[0], proofGraph)!;
        const radStmt = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkTangentPerpRelationship(tanStmt, radStmt, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "tangent_perp_conv": {
        const perpStmt_conv = getDepStmt(reason.arguments[0], proofGraph)!;
        const radStmt_conv = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkTangentPerpRelationship(
          stmt,
          radStmt_conv,
          perpStmt_conv,
          ctx,
        );
        return floatReasonResult(r, currStep, reason);
      }

      case "con_tangents_ext": {
        const tan1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const tan2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = con_tangents_ext_check(tan1, tan2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "radius_chord_bisect": {
        const perp_rcb = getDepStmt(reason.arguments[0], proofGraph)!;
        const rad_rcb = getDepStmt(reason.arguments[1], proofGraph)!;
        const chord_rcb = getDepStmt(reason.arguments[2], proofGraph)!;
        const r = radius_chord_bisect_check(
          perp_rcb,
          rad_rcb,
          chord_rcb,
          stmt,
          ctx,
        );
        return floatReasonResult(r, currStep, reason);
      }

      case "radius_chord_bisect_conv": {
        const perpBis = getDepStmt(reason.arguments[0], proofGraph)!;
        const chord_conv = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = radius_chord_bisect_conv_check(
          perpBis,
          chord_conv,
          stmt,
          ctx,
        );
        return floatReasonResult(r, currStep, reason);
      }

      case "con_inscribed_angs": {
        const ins1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const ins2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = con_inscribed_angs_check(ins1, ins2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "con_seg_transitive":
      case "con_ang_transitive":
      case "con_tri_transitive": {
        const dep1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const dep2 = getDepStmt(reason.arguments[1], proofGraph)!;
        const r = checkTransitive(dep1, dep2, stmt, ctx);
        return floatReasonResult(r, currStep, reason);
      }

      case "circumcenter":
      case "incenter":
      default:
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

const floatReasonResult = (
  r: CheckerResult,
  currStep: ProofStep,
  reason: Reason,
): boolean => {
  if (!r.ok) {
    addStmtArgMismatchError(currStep.errors, reason.function, r.failure);
    return false;
  }
  return true;
};

const floatDiagramResult = (
  r: DiagramResult,
  currStep: ProofStep,
  reason: Reason,
): boolean => {
  if (!r.res.ok) {
    addStmtArgMismatchError(currStep.errors, reason.function, r.res.failure);
    return false;
  }
  currStep.diagramDeps = r.diagramDeps;
  return true;
};
