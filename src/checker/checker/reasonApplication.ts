import { getGeometricObject } from "checker/utils/utils";
import { Angle, ProofContent, Segment } from "../../geometry-object";
import {
  ParseDiagramStmt,
  ProofGraph,
  ProofStep,
  ReasonDefinition,
} from "../types/checkerTypes";
import {
  congAdjAngles,
  def_ang_bisect,
  defConRight,
  reflex_a,
  vert_ang,
} from "./reasonChecks/angleChecks";
import {
  altint,
  intersect_seg,
  midpt,
  perp,
  reflex_s,
} from "./reasonChecks/lineChecks";
import { parallelogram2, rectangle } from "./reasonChecks/polyChecks";
import {
  checkAas,
  checkAsa,
  checkCpctc,
  checkIsosceles,
  checkRhl,
  checkSas,
  checkSss,
} from "./reasonChecks/triangleChecks";
import { TriangleReasonFailure } from "./reasonChecks/triangleReasonResult";
import { validateGivenProofStep } from "./validators";

const addStmtArgMismatchError = (
  errors: ProofStep["errors"],
  reason: string,
  failure: TriangleReasonFailure,
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
      case "isosceles": {
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
        const perpMatches = Array.from(proofGraph.diagramPremises.values())
          .filter(
            (d) =>
              d.statement.function === "on_line" ||
              d.statement.function === "midpt",
          )
          .filter((d) => perp(right_perp, d.statement, stmt, ctx));
        if (perpMatches.length === 0)
          return failStmtArgMismatch(
            currStep,
            reason.function,
            "PERP_NO_MATCH",
          );
        currStep.diagramDeps = perpMatches;
        return true;
      }
      case "rectangle":
        const conSeg_rectangle = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          rectangle(conSeg_rectangle, stmt, ctx) ||
          failStmtArgMismatch(currStep, reason.function, "RECTANGLE_MISMATCH")
        );
      case "parallelogram1":
        // TODO implement
        return true;
      case "parallelogram2":
        const para_parallelogram = getDepStmt(reason.arguments[0], proofGraph)!;
        return (
          parallelogram2(para_parallelogram, stmt, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "PARALLELOGRAM2_MISMATCH",
          )
        );
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
      case "cong_adj_angles": {
        const right1 = getDepStmt(reason.arguments[0], proofGraph)!;
        const right2 = getDepStmt(reason.arguments[1], proofGraph)!;
        return (
          congAdjAngles(right1, right2, ctx) ||
          failStmtArgMismatch(
            currStep,
            reason.function,
            "CONG_ADJ_ANGLES_MISMATCH",
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

      case "given":
        return validateGivenProofStep(currStep, proofGraph);

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
