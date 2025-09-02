import { readFileSync } from "fs";
import { basename } from "path";
import {
  createError,
  logDebug,
  logError,
  LogLevel,
  setLogLevel,
} from "./errors/errorConstants.js";
import { Angle } from "./geometry/Angle.js";
import { DiagramContent } from "./geometry/DiagramContent.js";
import { Point } from "./geometry/Point.js";
import { Quadrilateral } from "./geometry/Quadrilateral.js";
import { Segment } from "./geometry/Segment.js";
import { Triangle } from "./geometry/Triangle.js";
import { ProofParser } from "./grammar/lezerParser.js";
import { loadReasonDefinitions } from "./grammar/reasonParser.js";
import { reflex_a, vert_ang } from "./grammar/reasons/angleChecks.js";
import { altint, midpt, perp, reflex_s } from "./grammar/reasons/lineChecks.js";
import { parallelogram2, rectangle } from "./grammar/reasons/polyChecks.js";
import {
  aas,
  asa,
  cpctc,
  isosceles,
  rhl,
  sas,
  sss,
} from "./grammar/reasons/triangleChecks.js";
import { loadStatementDefinitions } from "./grammar/stmtParser.js";
import { Reason, Stmt } from "./types/types.js";

// Import types locally to avoid module resolution issues
interface ReasonDefinition {
  name: string;
  dependencies: string[];
  conclusion: string;
}

interface StatementDefinition {
  name: string;
  parameters: string[];
  isPremisesOnly?: boolean;
}

// Types for the proof checker
interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  statement?: Stmt;
  stepNumber?: string;
}

interface Proof {
  title: string | null;
  premises: {
    points: string[];
    triangles: string[];
    quadrilaterals: string[];
    segments: string[];
    angles: string[];
  };
  steps: ProofStep[];
  goal?: string;
}

interface ProofGraph {
  nodes: Map<string, ProofStep>;
  edges: Map<string, string[]>;
  incorrectSteps: Set<string>;
  unusedSteps: Set<string>;
  cycles: string[][];
}

// Helper function to strip geometric object prefixes
const stripGeometricPrefix = (arg: string): string => {
  if (arg.startsWith("a_")) {
    return arg.substring(2); // Remove 'a_' prefix for angles
  } else if (arg.startsWith("t_")) {
    return arg.substring(2); // Remove 't_' prefix for triangles
  }
  return arg; // No prefix to strip
};

// Function to get geometric object from string identifier
const getGeometricObject = (
  arg: string,
  ctx: DiagramContent
): Point | Segment | Angle | Triangle | Quadrilateral => {
  if (arg.startsWith("a_")) {
    // Angle format: a_ABC - remove prefix and try to find angle
    const angleLabel = stripGeometricPrefix(arg);
    const angle = ctx.getAngle(angleLabel);
    if (!angle) {
      throw createError.geometric.angleNotFound(arg);
    }
    return angle;
  } else if (arg.startsWith("t_")) {
    // Triangle format: t_ABC - remove prefix and try to find triangle
    const triangleLabel = stripGeometricPrefix(arg);
    const triangle = ctx.getTriangle(triangleLabel);
    if (!triangle) {
      throw createError.geometric.triangleNotFound(arg);
    }
    return triangle;
  } else if (arg.startsWith("q_")) {
    // Quadrilateral format: q_ABCD - remove prefix and try to find quadrilateral
    const quadrilateralLabel = stripGeometricPrefix(arg);
    const quadrilateral = ctx.getQuadrilateral(quadrilateralLabel);
    if (!quadrilateral) {
      throw createError.geometric.quadrilateralNotFound(arg);
    }
    return quadrilateral;
  } else if (arg.length === 2 && /^[A-Z]{2}$/.test(arg)) {
    // Segment format: AB
    const segment = ctx.getSegment(arg);
    if (!segment) {
      throw createError.geometric.segmentNotFound(arg);
    }
    return segment;
  } else if (arg.length === 1 && /^[A-Z]$/.test(arg)) {
    // Point format: A
    const point = ctx.getPoint(arg);
    if (!point) {
      throw createError.geometric.pointNotFound(arg);
    }
    return point;
  }
  throw createError.geometric.cannotParseGeometricObject(arg);
};

// Parse a proof file
const parseProof = (filePath: string): Proof => {
  const content = readFileSync(filePath, "utf-8");
  const parser = new ProofParser();
  return parser.parse(content);
};

// Extract goal from proof title or premises
const extractGoal = (proof: Proof): string | undefined => {
  // Look for goal in the premises section (steps with type "goal")
  const goalStep = proof.steps.find((step) => step.type === "goal");
  if (goalStep && goalStep.statement) {
    return `${goalStep.statement.function}(${goalStep.statement.arguments.join(
      ", "
    )})`;
  }

  // Fallback: look for goal in title
  if (proof.title && proof.title.includes("->")) {
    const arrowIndex = proof.title.indexOf("->");
    return proof.title.substring(arrowIndex + 2).trim();
  }

  return undefined;
};

// Check if statement arguments match the expected parameters
const checkStatementArguments = (
  stmt: Stmt,
  stmtDefs: Map<string, StatementDefinition>
): boolean => {
  const definition = stmtDefs.get(stmt.function);
  if (!definition) {
    logError.parser.undefinedStatement(stmt.function);
    return false;
  }

  console.log(`    Statement definition:`, definition);
  console.log(
    `    Expected ${definition.parameters.length} args, got ${stmt.arguments.length}`
  );

  return stmt.arguments.length === definition.parameters.length;
};

// Check if reason dependencies match the expected number
const checkReasonStructure = (
  step: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph
): boolean => {
  const reason = step.reason;
  const stmt = step.statement;
  if (reason && stmt) {
    console.log(`    Checking reason: ${reason.function}`);

    const definition = reasonDefs.get(reason?.function);
    if (!definition) {
      logError.parser.undefinedReason(reason.function);
      return false;
    }
    console.log(`    ✅ Found definition:`, definition);

    reason.arguments.forEach((arg, idx) => {
      const stepNum = arg.replace(/[\[\]]/g, "");
      const dependencyStep = proofGraph.nodes.get(stepNum);
      const expectedType = definition.dependencies[idx];
      if (dependencyStep?.statement?.function !== expectedType) {
        logError.parser.dependencyMismatch(arg);
        return false;
      }
    });

    // Handle multiple possible conclusions (separated by commas)
    const possibleConclusions = definition.conclusion
      .split(", ")
      .map((c) => c.trim());
    console.log(
      `    Expected conclusions: [${possibleConclusions.join(", ")}]`
    );
    console.log(`    Actual statement function: ${stmt.function}`);

    const nameMatch = reason.function === definition.name;
    const conclusionMatch = possibleConclusions.includes(stmt.function);

    console.log(
      `    Name match: ${nameMatch}, Conclusion match: ${conclusionMatch}`
    );

    return nameMatch && conclusionMatch;
  }
  logError.parser.missingReasonOrStatement();
  return false;
};

// Generic validator for reason dependencies. Throws on mismatch for all steps.
const validateReasonDependencies = (
  reason: Reason,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph
): void => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    throw new Error(`Undefined reason: ${reason.function}`);
  }

  if (reason.arguments.length !== definition.dependencies.length) {
    throw new Error(
      `Dependency count mismatch for ${reason.function}: expected ${definition.dependencies.length}, got ${reason.arguments.length}`
    );
  }

  for (let i = 0; i < reason.arguments.length; i++) {
    const depRef = reason.arguments[i];
    const expectedType = definition.dependencies[i];
    const stepNum = depRef.replace(/[\[\]]/g, "");
    const dependencyStep = proofGraph.nodes.get(stepNum);
    if (!dependencyStep || !dependencyStep.statement) {
      throw new Error(
        `Missing dependency for ${reason.function} at index ${i} (ref ${depRef})`
      );
    }
    const foundType = dependencyStep.statement.function;
    if (foundType !== expectedType) {
      throw new Error(
        `Dependency mismatch for ${reason.function} at index ${i}: expected ${expectedType}, found ${foundType} (ref ${depRef})`
      );
    }
  }
};

const getDepStmt = (idx: string, proof: Proof) => {
  const conclusionStep = proof.steps.find((step) => step.stepNumber === idx);
  return conclusionStep?.statement;
};

// Check if reason is applied correctly using reason checker methods
const checkReasonApplication = (
  currStep: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph,
  proof: Proof,
  ctx: DiagramContent
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
      const dependencyStep = proofGraph.nodes.get(stepNum);

      if (!dependencyStep) {
        return false;
      }

      // Get the arguments from the dependency step
      const depArgs = dependencyStep.statement?.arguments || [];

      // if (depArgs.length !== 2) {
      //   return false;
      // }

      // Create geometric objects from the arguments
      const obj1 = getGeometricObject(depArgs[0], ctx);
      const obj2 = getGeometricObject(depArgs[1], ctx);
      dependencyArgs.push([obj1, obj2]);
    }

    // Call the appropriate reason checker method
    switch (reason.function) {
      case "reflex_s":
        if (dependencyArgs.length === 0) {
          if (currStep.statement?.arguments?.length === 2) {
            return reflex_s(
              getGeometricObject(
                currStep.statement.arguments[0],
                ctx
              ) as Segment,
              getGeometricObject(
                currStep.statement.arguments[1],
                ctx
              ) as Segment
            );
          }
        }
        return false;

      case "reflex_a":
        if (dependencyArgs.length === 0) {
          if (currStep.statement?.arguments?.length === 2) {
            return reflex_a(
              getGeometricObject(currStep.statement.arguments[0], ctx) as Angle,
              getGeometricObject(currStep.statement.arguments[1], ctx) as Angle
            );
          }
        }
        return false;

      case "altint":
        const transversal = getDepStmt(reason.arguments[1], proof);
        const para = getDepStmt(reason.arguments[2], proof);
        if (currStep.statement && transversal && para) {
          return altint(currStep.statement, transversal, para, ctx);
        }
        return false;
      case "altint_conv":
        const conAng_conv = getDepStmt(reason.arguments[0], proof);
        const transversal_conv = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && conAng_conv && transversal_conv) {
          return altint(conAng_conv, transversal_conv, currStep.statement, ctx);
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
        const isos_isos = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && conSeg_isos && isos_isos) {
          return isosceles(conSeg_isos, isos_isos, ctx);
        }
        return false;

      case "midpt":
        const conSeg_midpt = getDepStmt(reason.arguments[0], proof);
        const midPt_midpt = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && conSeg_midpt && midPt_midpt) {
          return midpt(conSeg_midpt, midPt_midpt, ctx);
        }
        return false;
      case "midpt_conv":
        const conSeg_midpt_conv = getDepStmt(reason.arguments[0], proof);
        const midPt_midpt_conv = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && conSeg_midpt_conv && midPt_midpt_conv) {
          return midpt(conSeg_midpt_conv, midPt_midpt_conv, ctx);
        }
        return false;

      case "perp":
        const right_perp = getDepStmt(reason.arguments[0], proof);
        const perp_perp = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && right_perp && perp_perp) {
          return perp(right_perp, perp_perp, ctx);
        }
        return false;
      case "rectangle":
        const conSeg_rectangle = getDepStmt(reason.arguments[1], proof);
        if (currStep.statement && conSeg_rectangle) {
          return rectangle(currStep.statement, conSeg_rectangle, ctx);
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
      // case "intersect_seg":
      //   if (currStep.statement) {
      //     return intersect_seg(currStep.statement, ctx);
      //   }
      //   return false;

      case "vert_ang":
        const intersect_vert = getDepStmt(reason.arguments[0], proof);
        if (currStep.statement && intersect_vert) {
          return vert_ang(intersect_vert, currStep.statement, ctx);
        }
        return false;

      default:
        // For other reasons, we'll return true for now (syntax check passed)
        return true;
    }
  } catch (error) {
    console.error(
      `Error checking reason application for ${reason.function}:`,
      error
    );
    return false;
  }
};

// Build proof graph and check each step
const buildProofGraph = (
  proof: Proof,
  reasonDefs: Map<string, ReasonDefinition>,
  stmtDefs: Map<string, StatementDefinition>,
  ctx: DiagramContent
): ProofGraph => {
  const graph: ProofGraph = {
    nodes: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };

  // Add all steps to the graph (skip goal steps)
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum = step.stepNumber?.replace(/[\[\]]/g, "");
    if (stepNum) {
      graph.nodes.set(stepNum, step);
      graph.edges.set(stepNum, []);
    }
  });

  // Check each step and build edges
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum = step.stepNumber?.replace(/[\[\]]/g, "");

    if (!stepNum) return;

    let isCorrect = true;

    if (step.type === "given") {
      // Given statements are assumed to be true, but check format
      if (step.statement?.function) {
        // For now, just check if the function exists in definitions
        // In a real implementation, you'd check the actual statement format
        isCorrect = stmtDefs.has(step.statement.function);
      }
    } else if (step.type === "proof" && step.reason && step.statement) {
      logDebug(`\n🔍 Checking step ${stepNum}:`);
      logDebug(JSON.stringify(step, null, 2));

      // Check reason dependencies
      isCorrect = checkReasonStructure(step, reasonDefs, graph);
      logDebug(`  Reason structure check: ${isCorrect}`);

      // Validate dependency statements (throws on mismatch)
      if (isCorrect) {
        try {
          validateReasonDependencies(step.reason, reasonDefs, graph);
          logDebug(`  Dependency statements check: true`);
        } catch (e: any) {
          logError.proofChecker.errorCheckingProof(e);
          isCorrect = false;
        }
      }

      // Check statement
      if (isCorrect) {
        logDebug(
          `  Checking statement: ${
            step.statement?.function
          } with args: ${JSON.stringify(step.statement?.arguments)}`
        );
        isCorrect = checkStatementArguments(step.statement, stmtDefs);
        logDebug(`  Statement arguments check: ${isCorrect}`);

        // Check if premises-only statement is used in proof step
        if (isCorrect && step.statement?.function) {
          const stmtDef = stmtDefs.get(step.statement.function);
          if (stmtDef?.isPremisesOnly && step.type === "proof") {
            logError.parser.premisesOnlyStatementInProof(
              step.statement.function
            );
            isCorrect = false;
          }
        }
      }

      // TODO add a flag to the step if there was a mistake in it

      // Check if reason is applied correctly using reason checker methods
      if (isCorrect) {
        isCorrect = checkReasonApplication(step, reasonDefs, graph, proof, ctx);
        logDebug(`  Reason application check: ${isCorrect}`);
      }

      // Add edges from dependencies to this step
      if (step.reason.arguments) {
        step.reason.arguments.forEach((depRef) => {
          const depStepNum = depRef.replace(/[\[\]]/g, "");
          const edges = graph.edges.get(depStepNum) || [];
          edges.push(stepNum);
          graph.edges.set(depStepNum, edges);
        });
      }
    }

    if (!isCorrect) {
      graph.incorrectSteps.add(stepNum);
    }
  });

  return graph;
};

// Check for cycles in the graph using DFS
const detectCycles = (graph: ProofGraph): string[][] => {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (node: string, path: string[]): void => {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.edges.get(node) || [];
    neighbors.forEach((neighbor) => {
      dfs(neighbor, [...path]);
    });

    recursionStack.delete(node);
  };

  graph.nodes.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });

  return cycles;
};

// Find unused steps (leaf nodes that don't lead to the goal)
const findUnusedSteps = (graph: ProofGraph, goalStep?: string): Set<string> => {
  const unused = new Set<string>();

  if (!goalStep) {
    // If no goal specified, mark all leaf nodes as unused
    graph.nodes.forEach((_, node) => {
      const edges = graph.edges.get(node) || [];
      if (edges.length === 0) {
        unused.add(node);
      }
    });
    return unused;
  }

  // Find all nodes that can reach the goal
  const canReachGoal = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (node === goalStep) {
      return true;
    }

    if (visited.has(node)) {
      return canReachGoal.has(node);
    }

    visited.add(node);
    const neighbors = graph.edges.get(node) || [];

    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        canReachGoal.add(node);
        return true;
      }
    }

    return false;
  };

  graph.nodes.forEach((_, node) => {
    if (!canReachGoal.has(node) && !dfs(node)) {
      unused.add(node);
    }
  });

  return unused;
};

// Check for duplicate steps in the proof
const findDuplicateSteps = (proof: Proof): Array<[string, string]> => {
  const duplicates: Array<[string, string]> = [];
  const stepMap = new Map<string, string>(); // step content -> step number

  // Only check proof steps (not given statements or goals)
  const proofSteps = proof.steps.filter((step) => step.type === "proof");

  for (const step of proofSteps) {
    if (!step.statement || !step.reason) continue;

    // Create a normalized representation of the step
    const stepContent = JSON.stringify({
      reason: step.reason.function,
      reasonArgs: step.reason.arguments,
      statement: step.statement.function,
      statementArgs: step.statement.arguments,
    });

    if (stepMap.has(stepContent)) {
      const existingStepNum = stepMap.get(stepContent)!;
      duplicates.push([existingStepNum, step.stepNumber || "unknown"]);
    } else {
      stepMap.set(stepContent, step.stepNumber || "unknown");
    }
  }

  return duplicates;
};

// Check for sequential step numbers across all steps
const checkSequentialStepNumbers = (proof: Proof): Array<string> => {
  const errors: Array<string> = [];
  const seenStepNumbers = new Set<string>();

  // Get all steps that have step numbers (given statements and proof steps)
  const numberedSteps = proof.steps.filter((step) => step.stepNumber);

  for (let i = 0; i < numberedSteps.length; i++) {
    const step = numberedSteps[i];
    const expectedStepNumber = `[${String(i + 1).padStart(2, "0")}]`;

    // Check for duplicate step numbers
    if (seenStepNumbers.has(step.stepNumber!)) {
      logError.parser.duplicateStepNumbers(step.stepNumber!);
      errors.push(`Duplicate step number: ${step.stepNumber}`);
    } else {
      seenStepNumbers.add(step.stepNumber!);
    }

    // Check for sequential numbering across all steps
    if (step.stepNumber !== expectedStepNumber) {
      logError.parser.nonSequentialStepNumbers(
        expectedStepNumber,
        step.stepNumber!
      );
      errors.push(
        `Non-sequential step number: expected ${expectedStepNumber}, found ${step.stepNumber}`
      );
    }
  }

  return errors;
};

// Check if geometric objects are well-formed
const checkGeometricObjects = (proof: Proof): Array<string> => {
  const errors: Array<string> = [];
  const definedPoints = new Set(proof.premises.points);

  // Helper function to check for duplicate characters
  const hasDuplicateChars = (str: string): boolean => {
    const chars = str.split("");
    return chars.length !== new Set(chars).size;
  };

  // Helper function to check if all points in an object are defined
  const checkPointsDefined = (object: string, points: string[]): void => {
    for (const point of points) {
      if (!definedPoints.has(point)) {
        logError.parser.undefinedPointInObject(point, object);
        errors.push(
          `Point '${point}' in '${object}' is not defined in premises`
        );
      }
    }
  };

  // Check segments in premises
  for (const segment of proof.premises.segments) {
    if (segment.length !== 2) {
      logError.parser.invalidSegmentFormat(segment);
      errors.push(
        `Invalid segment format: '${segment}' - segments must have exactly 2 points`
      );
      continue;
    }

    if (hasDuplicateChars(segment)) {
      logError.parser.duplicatePointsInObject(segment);
      errors.push(`Segment '${segment}' contains duplicate points`);
      continue;
    }

    checkPointsDefined(segment, segment.split(""));
  }

  // Check triangles in premises
  for (const triangle of proof.premises.triangles) {
    const trianglePoints = triangle.substring(2); // Remove 't_' prefix

    if (trianglePoints.length !== 3) {
      logError.parser.invalidTriangleFormat(triangle);
      errors.push(
        `Invalid triangle format: '${triangle}' - triangles must have exactly 3 points`
      );
      continue;
    }

    if (hasDuplicateChars(trianglePoints)) {
      logError.parser.duplicatePointsInObject(triangle);
      errors.push(`Triangle '${triangle}' contains duplicate points`);
      continue;
    }

    checkPointsDefined(triangle, trianglePoints.split(""));
  }

  // Check quadrilaterals in premises
  for (const quadrilateral of proof.premises.quadrilaterals) {
    const quadrilateralPoints = quadrilateral.substring(2); // Remove 'q_' prefix

    if (quadrilateralPoints.length !== 4) {
      logError.parser.invalidQuadrilateralFormat(quadrilateral);
      errors.push(
        `Invalid quadrilateral format: '${quadrilateral}' - quadrilaterals must have exactly 4 points`
      );
      continue;
    }

    if (hasDuplicateChars(quadrilateralPoints)) {
      logError.parser.duplicatePointsInObject(quadrilateral);
      errors.push(`Quadrilateral '${quadrilateral}' contains duplicate points`);
      continue;
    }

    checkPointsDefined(quadrilateral, quadrilateralPoints.split(""));
  }

  // Check angles in premises
  for (const angle of proof.premises.angles) {
    const anglePoints = angle.substring(2); // Remove 'a_' prefix

    if (anglePoints.length !== 3) {
      logError.parser.invalidAngleFormat(angle);
      errors.push(
        `Invalid angle format: '${angle}' - angles must have exactly 3 points`
      );
      continue;
    }

    if (hasDuplicateChars(anglePoints)) {
      logError.parser.duplicatePointsInObject(angle);
      errors.push(`Angle '${angle}' contains duplicate points`);
      continue;
    }

    checkPointsDefined(angle, anglePoints.split(""));
  }

  // Check geometric objects in all statements
  for (const step of proof.steps) {
    if (step.statement?.arguments) {
      for (const arg of step.statement.arguments) {
        // Check segments (2 characters, no prefix)
        if (
          arg.length === 2 &&
          !arg.startsWith("a_") &&
          !arg.startsWith("t_")
        ) {
          if (hasDuplicateChars(arg)) {
            logError.parser.duplicatePointsInObject(arg);
            errors.push(`Segment '${arg}' contains duplicate points`);
            continue;
          }
          checkPointsDefined(arg, arg.split(""));
        }

        // Check angles (starts with 'a_', then 3 characters)
        if (arg.startsWith("a_")) {
          const anglePoints = arg.substring(2);
          if (anglePoints.length !== 3) {
            logError.parser.invalidAngleFormat(arg);
            errors.push(
              `Invalid angle format: '${arg}' - angles must have exactly 3 points`
            );
            continue;
          }
          if (hasDuplicateChars(anglePoints)) {
            logError.parser.duplicatePointsInObject(arg);
            errors.push(`Angle '${arg}' contains duplicate points`);
            continue;
          }
          checkPointsDefined(arg, anglePoints.split(""));
        }

        // Check triangles (starts with 't_', then 3 characters)
        if (arg.startsWith("t_")) {
          const trianglePoints = arg.substring(2);
          if (trianglePoints.length !== 3) {
            logError.parser.invalidTriangleFormat(arg);
            errors.push(
              `Invalid triangle format: '${arg}' - triangles must have exactly 3 points`
            );
            continue;
          }
          if (hasDuplicateChars(trianglePoints)) {
            logError.parser.duplicatePointsInObject(arg);
            errors.push(`Triangle '${arg}' contains duplicate points`);
            continue;
          }
          checkPointsDefined(arg, trianglePoints.split(""));
        }

        // Check quadrilaterals (starts with 'q_', then 4 characters)
        if (arg.startsWith("q_")) {
          const quadrilateralPoints = arg.substring(2);
          if (quadrilateralPoints.length !== 4) {
            logError.parser.invalidQuadrilateralFormat(arg);
            errors.push(
              `Invalid quadrilateral format: '${arg}' - quadrilaterals must have exactly 4 points`
            );
            continue;
          }
          if (hasDuplicateChars(quadrilateralPoints)) {
            logError.parser.duplicatePointsInObject(arg);
            errors.push(`Quadrilateral '${arg}' contains duplicate points`);
            continue;
          }
          checkPointsDefined(arg, quadrilateralPoints.split(""));
        }
      }
    }
  }

  return errors;
};

// Check if final statement matches the goal
const checkGoalMatch = (
  proof: Proof,
  goal?: string
): { matches: boolean; details: string } => {
  if (!goal) return { matches: true, details: "No goal specified" };

  // Find the last proof step (not goal step)
  const lastProofStep = proof.steps
    .slice()
    .reverse()
    .find((step) => step.type === "proof");

  if (!lastProofStep) {
    return { matches: false, details: "No proof steps found" };
  }

  const finalStatement = lastProofStep.statement;
  if (!finalStatement) {
    return { matches: false, details: "Last proof step has no statement" };
  }

  // Parse the goal to extract function and arguments
  const goalMatch = goal.match(/^(\w+)\(([^)]*)\)$/);
  if (!goalMatch) {
    return { matches: false, details: `Invalid goal format: ${goal}` };
  }

  const [, expectedFunction, expectedArgsStr] = goalMatch;
  const expectedArgs = expectedArgsStr.split(",").map((arg) => arg.trim());

  // Check function match
  if (finalStatement.function !== expectedFunction) {
    return {
      matches: false,
      details: `Function mismatch: expected '${expectedFunction}', got '${finalStatement.function}'`,
    };
  }

  // Check arguments match
  if (
    !finalStatement.arguments ||
    finalStatement.arguments.length !== expectedArgs.length
  ) {
    return {
      matches: false,
      details: `Argument count mismatch: expected ${expectedArgs.length}, got ${
        finalStatement.arguments?.length || 0
      }`,
    };
  }

  // Check each argument
  for (let i = 0; i < expectedArgs.length; i++) {
    if (finalStatement.arguments[i] !== expectedArgs[i]) {
      return {
        matches: false,
        details: `Argument ${i + 1} mismatch: expected '${
          expectedArgs[i]
        }', got '${finalStatement.arguments[i]}'`,
      };
    }
  }

  return {
    matches: true,
    details: `Goal matched: ${
      finalStatement.function
    }(${finalStatement.arguments.join(", ")})`,
  };
};

// Main proof checker function
const checkProof = (filePath: string): void => {
  console.log(`\n🔍 Checking proof: ${basename(filePath)}\n`);

  try {
    // Load definitions
    const reasonDefs = loadReasonDefinitions();
    const stmtDefs = loadStatementDefinitions();

    logDebug("📚 Parsing statement definitions...");

    // Parse proof
    const proof = parseProof(filePath);
    const goal = extractGoal(proof);

    // Check geometric objects are well-formed before creating context
    const geometricObjectErrors = checkGeometricObjects(proof);
    if (geometricObjectErrors.length > 0) {
      console.log("❌ Geometric object errors found:");
      geometricObjectErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
      throw new Error("Proof has geometric object errors");
    }

    // Create DiagramContent context and populate it with all geometric objects from premises
    const ctx = new DiagramContent();

    // Add all points from premises
    proof.premises.points.forEach((pointLabel) => {
      ctx.addPoint({ pt: [0, 0], label: pointLabel, offset: [0, 0] }); // TODO pt coords
    });

    // Add all triangles from premises (this will also create their segments and angles)
    proof.premises.triangles.forEach((triangleLabel) => {
      // Parse triangle label (e.g., "t_ABC")
      const pointLabels = triangleLabel.substring(2); // Remove 't_' prefix
      ctx.addTriangleFromStr(pointLabels);
    });

    // Add all quadrilaterals from premises (this will also create their segments and angles)
    proof.premises.quadrilaterals.forEach((quadrilateralLabel) => {
      // Parse quadrilateral label (e.g., "q_ABCD")
      const pointLabels = quadrilateralLabel.substring(2); // Remove 'q_' prefix
      ctx.addQuadrilateralFromStr(pointLabels);
    });

    // Add all segments from premises
    proof.premises.segments.forEach((segmentLabel) => {
      ctx.addSegmentFromStr(segmentLabel);
    });

    // Add all angles from premises
    proof.premises.angles.forEach((angleLabel) => {
      // Parse angle label (e.g., "a_BAC")
      const pointLabels = angleLabel.substring(2); // Remove 'a_' prefix
      ctx.addAngleFromStr(pointLabels);
    });

    // Process given statements to create geometric objects
    proof.steps.forEach((step) => {
      if (
        step.type === "given" &&
        step.statement?.function &&
        step.statement.arguments
      ) {
        if (step.statement.function === "con_seg") {
          // Given congruent segments - ensure both segments exist
          step.statement.arguments.forEach((arg: string) => {
            ctx.addSegmentFromStr(arg);
          });
        } else if (step.statement.function === "con_ang") {
          // Given congruent angles - ensure both angles exist
          step.statement.arguments.forEach((arg: string) => {
            if (arg.startsWith("a_")) {
              ctx.addAngleFromStr(arg.substring(2));
            }
          });
        } else if (step.statement.function === "on_line") {
          const [seg, pt] = step.statement.arguments;
          const s = ctx.addSegmentFromStr(seg);
          const p = ctx.getPoint(pt);
          p.addOnLine(s);
          const ps2 = ctx.addSegmentFromStr(`${p.label}${s.p2.label}`);
          const ps1 = ctx.addSegmentFromStr(`${s.p1.label}${p.label}`);
          ps1.addParentSegment(s);
          ps2.addParentSegment(s);
        } else if (step.statement.function === "intersect_seg") {
          // Given intersecting segments - ensure both segments exist
          const [seg1, seg2, point] = step.statement.arguments;

          // Check if the intersection point exists in premises
          if (!proof.premises.points.includes(point)) {
            logError.parser.missingPointInPremises(point);
            throw new Error(
              `Point '${point}' is used in intersect_seg but not defined in premises`
            );
          }

          const s1 = ctx.addSegmentFromStr(seg1);
          const s2 = ctx.addSegmentFromStr(seg2);
          const p = ctx.getPoint(point);

          seg1.split("").forEach((pt) => {
            const subSeg = ctx.addSegmentFromStr(`${p.label}${pt}`);
            s1.addSubSegment(subSeg);
            subSeg.addParentSegment(s1);
          });
          seg2.split("").forEach((pt) => {
            const subSeg = ctx.addSegmentFromStr(`${p.label}${pt}`);
            s2.addSubSegment(subSeg);
            subSeg.addParentSegment(s2);
          });
        } else if (step.statement.function === "transversal") {
          const [s1p1, s1p2, p1, s2p1, s2p2, p2] = step.statement.arguments.map(
            (arg) => ctx.getPoint(arg)
          );
          const [s1, s2] = [
            ctx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`),
            ctx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`),
          ];
          ctx.addSegmentFromStr(`${p1.label}${p2.label}`);
          p1.addOnLine(s1);
          p2.addOnLine(s2);
        } else if (step.statement.function === "midpt") {
          const s = ctx.addSegmentFromStr(step.statement.arguments[0]);
          const p = ctx.getPoint(step.statement.arguments[1]);
          p.addOnLine(s);
          ctx.addSegmentFromStr(`${p.label}${s.p2.label}`).addParentSegment(s);
          ctx.addSegmentFromStr(`${s.p1.label}${p.label}`).addParentSegment(s);
        }
      }
    });

    console.log("checking angle overlaps");
    ctx.checkAngleOverlaps();

    // Build proof graph
    logDebug("Building proof graph...");
    const graph = buildProofGraph(proof, reasonDefs, stmtDefs, ctx);

    // Detect cycles
    graph.cycles = detectCycles(graph);

    // Find unused steps
    // Find the last proof step (not goal step) to use as the goal step number
    const lastProofStep = proof.steps
      .slice()
      .reverse()
      .find((step) => step.type === "proof");
    const lastStepNum = lastProofStep?.stepNumber?.replace(/[\[\]]/g, "");

    graph.unusedSteps = findUnusedSteps(graph, lastStepNum);

    // Check for duplicate steps
    const duplicateSteps = findDuplicateSteps(proof);

    // Check for sequential step numbers
    const stepNumberErrors = checkSequentialStepNumbers(proof);

    // Check goal match
    const goalMatchResult = checkGoalMatch(proof, goal);

    // Pretty print results (always displayed)
    console.log("📋 Proof Analysis Results:");
    console.log("=".repeat(50));

    console.log(`\n📝 Title: ${proof.title || "No title"}`);
    if (goal) {
      console.log(`🎯 Goal: ${goal}`);
      console.log(`✅ Goal Match: ${goalMatchResult.matches ? "YES" : "NO"}`);
      console.log(`📋 Goal Details: ${goalMatchResult.details}`);
    }

    console.log(`\n📊 Statistics:`);
    console.log(
      `   • Total Steps: ${proof.steps.filter((s) => s.type !== "goal").length}`
    );
    console.log(
      `   • Given Statements: ${
        proof.steps.filter((s) => s.type === "given").length
      }`
    );
    console.log(
      `   • Proof Steps: ${
        proof.steps.filter((s) => s.type === "proof").length
      }`
    );

    if (graph.incorrectSteps.size > 0) {
      logError.proofChecker.incorrectSteps(graph.incorrectSteps.size);
      Array.from(graph.incorrectSteps)
        .sort()
        .forEach((step) => {
          console.log(`   • Step ${step}`);
        });
    }

    console.log(`\n🚫 Unused Steps: ${graph.unusedSteps.size}`);
    if (graph.unusedSteps.size > 0) {
      Array.from(graph.unusedSteps)
        .sort()
        .forEach((step) => {
          console.log(`   • Step ${step}`);
        });
    }

    console.log(`\n🔄 Cycles: ${graph.cycles.length}`);
    if (graph.cycles.length > 0) {
      graph.cycles.forEach((cycle, index) => {
        console.log(
          `   • Cycle ${index + 1}: ${cycle.join(" → ")} → ${cycle[0]}`
        );
      });
    }

    console.log(`\n🔄 Duplicate Steps: ${duplicateSteps.length}`);
    if (duplicateSteps.length > 0) {
      duplicateSteps.forEach(([step1, step2]) => {
        logError.parser.duplicateSteps(step1, step2);
      });
    }

    console.log(`\n📝 Step Number Errors: ${stepNumberErrors.length}`);
    if (stepNumberErrors.length > 0) {
      stepNumberErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
    }

    console.log(
      `\n🔷 Geometric Object Errors: ${geometricObjectErrors.length}`
    );
    if (geometricObjectErrors.length > 0) {
      geometricObjectErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
    }

    console.log(`\n🎯 Overall Assessment:`);
    const hasErrors =
      graph.incorrectSteps.size > 0 ||
      graph.unusedSteps.size > 0 ||
      graph.cycles.length > 0 ||
      duplicateSteps.length > 0 ||
      stepNumberErrors.length > 0 ||
      geometricObjectErrors.length > 0 ||
      !goalMatchResult.matches;

    if (!hasErrors) {
      console.log("✅ Proof is CORRECT!");
    } else {
      logError.proofChecker.proofHasIssues();
    }
  } catch (error) {
    logError.proofChecker.errorCheckingProof(error);
  }
};

// Export for use in other modules
export {
  checkProof,
  Proof,
  ProofGraph,
  ProofStep,
  ReasonDefinition,
  StatementDefinition,
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let proofFile: string | null = null;
  let logLevel = LogLevel.WARN; // Default to warnings and errors

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--log-level" || arg === "-l") {
      const levelArg = args[i + 1];
      if (!levelArg) {
        console.error(
          "Error: --log-level requires a value (debug, info, warn, error)"
        );
        process.exit(1);
      }

      switch (levelArg.toLowerCase()) {
        case "debug":
          logLevel = LogLevel.DEBUG;
          break;
        case "info":
          logLevel = LogLevel.INFO;
          break;
        case "warn":
          logLevel = LogLevel.WARN;
          break;
        case "error":
          logLevel = LogLevel.ERROR;
          break;
        default:
          console.error(
            `Error: Invalid log level '${levelArg}'. Use: debug, info, warn, error`
          );
          process.exit(1);
      }
      i++; // Skip the next argument since we consumed it
    } else {
      proofFile = arg;
    }
  }

  if (!proofFile) {
    console.log(
      "Usage: npm run check-proof [--log-level <level>] <proof-file>"
    );
    console.log("Log levels: debug, info, warn, error (default: warn)");
    process.exit(1);
  }

  // Set the log level
  setLogLevel(logLevel);

  checkProof(proofFile);
}
