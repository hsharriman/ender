import { createError, logError } from "../errors/errorConstants";
import {
  ProofGraph,
  ProofObj,
  ProofStep,
  Reason,
  ReasonDefinition,
  StatementDefinition,
  Stmt,
} from "../types/checkerTypes";
import { Obj } from "../types/types";

// Check if statement arguments match the expected parameters
export const checkStatementArguments = (
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
export const checkReasonStructure = (
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

// Check if geometric objects are well-formed
export const checkGeometricObjects = (proof: ProofObj): Array<string> => {
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
        switch (arg.type) {
          case Obj.Segment:
            if (hasDuplicateChars(arg.v)) {
              logError.parser.duplicatePointsInObject(arg.v);
              errors.push(`Segment '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Angle:
            if (arg.v.length !== 3) {
              logError.parser.invalidAngleFormat(arg.v);
              errors.push(
                `Invalid angle format: '${arg}' - angles must have exactly 3 points`
              );
              break;
            }
            if (hasDuplicateChars(arg.v)) {
              logError.parser.duplicatePointsInObject(arg.v);
              errors.push(`Angle '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Triangle:
            if (arg.v.length !== 3) {
              logError.parser.invalidTriangleFormat(arg.v);
              errors.push(
                `Invalid triangle format: '${arg}' - triangles must have exactly 3 points`
              );
              break;
            }
            if (hasDuplicateChars(arg.v)) {
              logError.parser.duplicatePointsInObject(arg.v);
              errors.push(`Triangle '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Quadrilateral:
            if (arg.v.length !== 4) {
              logError.parser.invalidQuadrilateralFormat(arg.v);
              errors.push(
                `Invalid quadrilateral format: '${arg.v}' - quadrilaterals must have exactly 4 points`
              );
              break;
            }
            if (hasDuplicateChars(arg.v)) {
              logError.parser.duplicatePointsInObject(arg.v);
              errors.push(`Quadrilateral '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Point:
            if (!definedPoints.has(arg.v)) {
              logError.parser.undefinedPointInObject(arg.v, "point");
              errors.push(`Point '${arg.v}' is not defined in premises`);
              continue;
            }
            break;
          default:
            throw createError.geometric.cannotParseGeometricObject(arg.v);
        }
      }
    }
  }

  return errors;
};

// Check if final statement matches the goal
export const checkGoalMatch = (
  proof: ProofObj,
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
    if (finalStatement.arguments[i].v !== expectedArgs[i]) {
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
    }(${finalStatement.arguments.map((arg) => arg.v).join(", ")})`,
  };
};

// Generic validator for reason dependencies. Throws on mismatch for all steps.
export const validateReasonDependencies = (
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

// Check for duplicate steps in the proof
export const findDuplicateSteps = (
  proof: ProofObj
): Array<[string, string]> => {
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
export const checkSequentialStepNumbers = (proof: ProofObj): Array<string> => {
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
