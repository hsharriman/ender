import {
  Angle,
  Obj,
  ParseObj,
  Point,
  ProofContent,
  Quadrilateral,
  Segment,
  Triangle,
} from "geometry-object";
import { createError, logError } from "../errors/errorConstants";
import {
  ProofGraph,
  ProofObj,
  ProofStep,
  ReasonDefinition,
} from "../types/checkerTypes";
import { ang_bisect, reflex_a, vert_ang } from "./reasonChecks/angleChecks";
import {
  altint,
  intersect_seg,
  midpt,
  perp,
  reflex_s,
} from "./reasonChecks/lineChecks";
import { parallelogram2, rectangle } from "./reasonChecks/polyChecks";
import {
  aas,
  asa,
  cpctc,
  isosceles,
  rhl,
  sas,
  sss,
} from "./reasonChecks/triangleChecks";
import { validateGivenProofStep } from "./validators";

// Check if reason is applied correctly using reason checker methods
export const checkReasonApplication = (
  currStep: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph,
  proof: ProofObj,
  ctx: ProofContent,
): boolean => {
  const reason = currStep.reason!;
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    logError.parser.undefinedReason(reason.function);
    return false;
  }

  try {
    // Get the dependency steps and their arguments
    const dependencyArgs: any[] = [];
    for (let i = 0; i < reason.arguments.length; i++) {
      const depRef = reason.arguments[i];
      const stepNum = depRef.replace(/[\[\]]/g, "");

      // TODO clean up when separating diagram premises from proof graph
      const dependencyStep =
        proofGraph.nodes.get(stepNum) ||
        ({
          // Diagram premises are stored outside the proof graph.
          statement: proof.premises.diagramStatements.find(
            (d) => d.stepNumber === stepNum,
          )?.statement,
        } as any);

      if (!dependencyStep?.statement) {
        return false;
      }

      // Get the arguments from the dependency step
      const depArgs = dependencyStep.statement.arguments || [];

      // Create geometric objects from the arguments

      dependencyArgs.push(
        depArgs.map((arg: any) => getGeometricObject(arg, ctx)),
      );
    }

    // Call the appropriate reason checker method
    switch (reason.function) {
      case "reflex_s":
        if (dependencyArgs.length === 0) {
          if (currStep.statement?.arguments?.length === 2) {
            return reflex_s(
              getGeometricObject(
                currStep.statement.arguments[0],
                ctx,
              ) as Segment,
              getGeometricObject(
                currStep.statement.arguments[1],
                ctx,
              ) as Segment,
            );
          }
        }
        return false;

      case "reflex_a":
        if (dependencyArgs.length === 0) {
          if (currStep.statement?.arguments?.length === 2) {
            return reflex_a(
              getGeometricObject(currStep.statement.arguments[0], ctx) as Angle,
              getGeometricObject(currStep.statement.arguments[1], ctx) as Angle,
            );
          }
        }
        return false;

      case "altint":
        const para_alt = getDepStmt(reason.arguments[0], proof);
        if (!currStep.statement || !para_alt) return false;
        return proof.premises.diagramStatements
          .filter((d) => d.statement.function === "transversal")
          .some((d) => altint(currStep.statement!, d.statement, para_alt, ctx));
      case "altint_conv":
        const conAng_conv = getDepStmt(reason.arguments[0], proof);
        if (!currStep.statement || !conAng_conv) return false;
        return proof.premises.diagramStatements
          .filter((d) => d.statement.function === "transversal")
          .some((d) => altint(conAng_conv, d.statement, currStep.statement!, ctx));
      case "ang_bisect":
        const bisect_bisect = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && bisect_bisect) {
          return ang_bisect(currStep.statement, bisect_bisect, ctx);
        }
        return false;
      case "ang_bisect_conv":
        const conAng_bisect_conv = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && conAng_bisect_conv) {
          return ang_bisect(conAng_bisect_conv, currStep.statement, ctx);
        }
        return false;

      case "sas":
        const s1 = getDepStmt(reason.arguments[0], proof);
        const a = getDepStmt(reason.arguments[1], proof);
        const s2 = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && s1 && a && s2) {
          return sas(currStep.statement, s1, a, s2, ctx);
        }
        return false;

      case "sss":
        const s1_sss = getDepStmt(reason.arguments[0], proof);
        const s2_sss = getDepStmt(reason.arguments[1], proof);
        const s3_sss = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && s1_sss && s2_sss && s3_sss) {
          return sss(currStep.statement, s1_sss, s2_sss, s3_sss, ctx);
        }
        return false;

      case "cpctc":
        const t_cong = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && t_cong) {
          return cpctc(t_cong, currStep.statement, ctx);
        }
        return false;

      case "aas":
        const a1_aas = getDepStmt(reason.arguments[0], proof);
        const a2_aas = getDepStmt(reason.arguments[1], proof);
        const s_aas = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && a1_aas && a2_aas && s_aas) {
          return aas(currStep.statement, a1_aas, a2_aas, s_aas, ctx);
        }
        return false;

      case "asa":
        const a1_asa = getDepStmt(reason.arguments[0], proof);
        const s_asa = getDepStmt(reason.arguments[1], proof);
        const a2_asa = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && a1_asa && s_asa && a2_asa) {
          return asa(currStep.statement, a1_asa, s_asa, a2_asa, ctx);
        }
        return false;

      case "rhl":
        const right_rhl = getDepStmt(reason.arguments[0], proof);
        const s1_rhl = getDepStmt(reason.arguments[1], proof);
        const s2_rhl = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && right_rhl && s1_rhl && s2_rhl) {
          return rhl(currStep.statement, right_rhl, s1_rhl, s2_rhl, ctx);
        }
        return false;
      case "isosceles":
        const conSeg_isos = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && conSeg_isos && currStep.statement) {
          return isosceles(conSeg_isos, currStep.statement, ctx);
        }
        return false;

      case "midpt":
        const midPt_midpt = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && midPt_midpt) {
          return midpt(currStep.statement, midPt_midpt, ctx);
        }
        return false;
      case "midpt_conv":
        const conSeg_midpt_conv = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && conSeg_midpt_conv) {
          return midpt(conSeg_midpt_conv, currStep.statement, ctx);
        }
        return false;

      case "perp":
        const right_perp = getDepStmt(reason.arguments[0], proof);
        if (!currStep.statement || !right_perp) return false;
        return proof.premises.diagramStatements
          .filter(
            (d) =>
              d.statement.function === "on_line" || d.statement.function === "midpt",
          )
          .some((d) => perp(right_perp, d.statement, currStep.statement!, ctx));
      case "rectangle":
        const conSeg_rectangle = getDepStmt(reason.arguments[0], proof);
        console.log("conSeg_rectangle", conSeg_rectangle, currStep.statement);
        if (currStep.statement && conSeg_rectangle) {
          return rectangle(conSeg_rectangle, currStep.statement, ctx);
        }
        return false;
      case "parallelogram1":
        const rect_parallelogram = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && rect_parallelogram) {
          return true;
        }
        return false;
      case "parallelogram2":
        const para_parallelogram = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && para_parallelogram) {
          return parallelogram2(para_parallelogram, currStep.statement, ctx);
        }
        return false;
      case "intersect_seg":
        const intersect_on1 = getDepStmt(reason.arguments[0], proof);
        const intersect_on2 = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && intersect_on1 && intersect_on2) {
          console.log(
            "intersect_seg",
            intersect_on1,
            intersect_on2,
            currStep.statement,
          );
          return intersect_seg(
            intersect_on1,
            intersect_on2,
            currStep.statement,
            ctx,
          );
        }
        return false;
      case "con_right":
        return true;
      case "vert_ang":
        if (!currStep.statement) return false;
        return proof.premises.diagramStatements
          .filter((d) => d.statement.function === "intersect_seg")
          .some((d) => vert_ang(d.statement, currStep.statement!, ctx));

      case "given":
        return validateGivenProofStep(currStep, proofGraph);

      default:
        // For other reasons, we'll return true for now (syntax check passed)
        return true;
    }
  } catch (error) {
    console.error(
      `Error checking reason application for ${reason.function}:`,
      error,
    );
    return false;
  }
};

// Function to get geometric object from string identifier
const getGeometricObject = (
  arg: ParseObj,
  ctx: ProofContent,
): Point | Segment | Angle | Triangle | Quadrilateral => {
  switch (arg.type) {
    case Obj.Angle:
      const angle = ctx.getAngle(arg.v);
      if (!angle) {
        throw createError.geometric.angleNotFound(arg.v);
      }
      return angle;
    case Obj.Triangle:
      const triangle = ctx.getTriangle(arg.v);
      if (!triangle) {
        throw createError.geometric.triangleNotFound(arg.v);
      }
      return triangle;
    case Obj.Quadrilateral:
      const quadrilateral = ctx.getQuadrilateral(arg.v);
      if (!quadrilateral) {
        throw createError.geometric.quadrilateralNotFound(arg.v);
      }
      return quadrilateral;
    case Obj.Segment:
      const segment = ctx.getSegment(arg.v);
      if (!segment) {
        throw createError.geometric.segmentNotFound(arg.v);
      }
      return segment;
    case Obj.Point:
      const point = ctx.getPoint(arg.v);
      if (!point) {
        throw createError.geometric.pointNotFound(arg.v);
      }
      return point;
    default:
      throw createError.geometric.cannotParseGeometricObject(arg.v);
  }
};

const getDepStmt = (idx: string, proof: ProofObj) => {
  const normalized = idx.replace(/[[\]]/g, "");

  const diagramDep = proof.premises.diagramStatements.find(
    (d) => d.stepNumber === normalized,
  );
  if (diagramDep) return diagramDep.statement;

  const conclusionStep = proof.steps.find(
    (step) => step.stepNumber?.replace(/[[\]]/g, "") === normalized,
  );
  return conclusionStep?.statement;
};
