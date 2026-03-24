import { createError, logError } from "../errors/errorConstants";
import {
  ProofGraph,
  ProofObj,
  ProofStep,
  Reason,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
  Stmt,
} from "../types/checkerTypes";
import { Obj } from "geometry-object";

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

/** `given([g_nn])` — premise must exist and conclusion must match it. */
export const validateGivenProofStep = (
  step: ProofStep,
  proofGraph: ProofGraph,
): boolean => {
  const reason = step.reason;
  const stmt = step.statement;
  if (!reason || !stmt) {
    logError.parser.missingReasonOrStatement();
    return false;
  }
  if (reason.arguments.length !== 1) {
    logError.parser.dependencyMismatch(
      `given expects exactly one premise ref, got ${reason.arguments.length}`,
    );
    return false;
  }
  const ref = reason.arguments[0].replace(/[[\]]/g, "");
  if (/^g_\d+$/.test(ref)) {
    // ok
  } else if (/^d_\d+$/.test(ref)) {
    logError.parser.dependencyMismatch(
      `given(${reason.arguments[0]}) is invalid: use only given premises [g_nn], not diagram premises [d_nn]`,
    );
    return false;
  } else if (/^\d+$/.test(ref)) {
    logError.parser.dependencyMismatch(
      `given(${reason.arguments[0]}) is invalid: cite the matching [g_nn] given premise, not a proof step number`,
    );
    return false;
  } else {
    logError.parser.dependencyMismatch(
      `given requires exactly one ref like [g_01], got ${reason.arguments[0]}`,
    );
    return false;
  }
  const depStep = proofGraph.nodes.get(ref);
  if (!depStep?.statement) {
    logError.parser.dependencyMismatch(
      `Missing given premise for ref ${reason.arguments[0]}`,
    );
    return false;
  }
  const prem = depStep.statement;
  if (prem.function !== stmt.function) {
    logError.parser.dependencyMismatch(
      `given conclusion mismatch: premise is ${prem.function}, step concludes ${stmt.function}`,
    );
    return false;
  }
  if (prem.arguments.length !== stmt.arguments.length) {
    logError.parser.dependencyMismatch(
      `given conclusion arg count mismatch for ${ref}`,
    );
    return false;
  }
  for (let i = 0; i < prem.arguments.length; i++) {
    if (
      prem.arguments[i].type !== stmt.arguments[i].type ||
      prem.arguments[i].v !== stmt.arguments[i].v
    ) {
      logError.parser.dependencyMismatch(
        `given conclusion arg ${i} mismatch vs premise ${ref}`,
      );
      return false;
    }
  }
  return true;
};

// Check if reason dependencies match the expected number
export const checkReasonStructure = (
  step: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  groups: Map<string, StatementGroup>,
  proofGraph: ProofGraph
): boolean => {
  const reason = step.reason;
  const stmt = step.statement;
  if (reason && stmt) {
    if (reason.function === "given") {
      return validateGivenProofStep(step, proofGraph);
    }

    console.log(`    Checking reason: ${reason.function}`);

    const definition = reasonDefs.get(reason?.function);
    if (!definition) {
      logError.parser.undefinedReason(reason.function);
      return false;
    }
    console.log(`    ✅ Found definition:`, definition);

    for (let idx = 0; idx < reason.arguments.length; idx++) {
      const arg = reason.arguments[idx];
      const stepNum = arg.replace(/\[|\]/g, "");
      const dependencyStep = proofGraph.nodes.get(stepNum);
      const expectedDep = definition.dependencies[idx];

      if (!dependencyStep?.statement) {
        logError.parser.dependencyMismatch(
          `Missing dependency for ${reason.function} at index ${idx} (ref ${arg})`
        );
        return false;
      }

      const foundType = dependencyStep.statement.function;

      // Check if expectedDep is a group or direct statement name
      if (typeof expectedDep === "string") {
        const group = groups.get(expectedDep);
        if (group) {
          // Check if foundType can substitute for the expected base type
          if (group.base === foundType) {
            // Direct match with base type - valid
            continue;
          } else if (group.extensions.includes(foundType)) {
            // Found type can substitute for base type - valid
            continue;
          } else {
            // No valid substitution
            logError.parser.dependencyMismatch(
              `Dependency mismatch for ${
                reason.function
              } at index ${idx}: expected ${
                group.base
              } or one of [${group.extensions.join(
                ", "
              )}], found ${foundType} (ref ${arg})`
            );
            return false;
          }
        } else {
          // Direct statement name match
          if (foundType !== expectedDep) {
            logError.parser.dependencyMismatch(
              `Dependency mismatch for ${reason.function} at index ${idx}: expected ${expectedDep}, found ${foundType} (ref ${arg})`
            );
            return false;
          }
        }
      }
    }

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
  const definedPoints = new Set(proof.premises.points.map((p) => p.v));

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
  goal?: Stmt
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

  const expectedFunction = goal.function;
  const expectedArgs = goal.arguments.map((a) => a.v);

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
    const stepNum = depRef.replace(/\[|\]/g, "");
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

// Non-throwing version that returns boolean and logs errors
export const checkReasonDependencies = (
  reason: Reason,
  reasonDefs: Map<string, ReasonDefinition>,
  groups: Map<string, StatementGroup>,
  proofGraph: ProofGraph,
  /** Required for `given` (validates vs conclusion). */
  fullStep?: ProofStep,
): boolean => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    logError.parser.undefinedReason(reason.function);
    return false;
  }

  if (reason.function === "given") {
    if (!fullStep) {
      logError.parser.dependencyMismatch("given step missing full step context");
      return false;
    }
    return validateGivenProofStep(fullStep, proofGraph);
  }

  if (reason.arguments.length !== definition.dependencies.length) {
    logError.parser.dependencyMismatch(
      `Dependency count mismatch for ${reason.function}: expected ${definition.dependencies.length}, got ${reason.arguments.length}`
    );
    return false;
  }

  for (let i = 0; i < reason.arguments.length; i++) {
    const depRef = reason.arguments[i];
    const expectedDep = definition.dependencies[i];
    const stepNum = depRef.replace(/[[\]]/g, "");
    const dependencyStep = proofGraph.nodes.get(stepNum);
    if (!dependencyStep || !dependencyStep.statement) {
      logError.parser.dependencyMismatch(
        `Missing dependency for ${reason.function} at index ${i} (ref ${depRef})`
      );
      return false;
    }
    const foundType = dependencyStep.statement.function;

    // Check if expectedDep is a group or direct statement name
    if (typeof expectedDep === "string") {
      // Check if it's a group name
      const group = groups.get(expectedDep);
      if (group) {
        // Check if foundType can substitute for the expected base type
        if (group.base === foundType) {
          // Direct match with base type
          continue;
        } else if (group.extensions.includes(foundType)) {
          // Found type can substitute for base type
          continue;
        } else {
          // No valid substitution
          logError.parser.dependencyMismatch(
            `Dependency mismatch for ${
              reason.function
            } at index ${i}: expected ${
              group.base
            } or one of [${group.extensions.join(
              ", "
            )}], found ${foundType} (ref ${depRef})`
          );
          return false;
        }
      } else {
        // Direct statement name match
        if (foundType !== expectedDep) {
          logError.parser.dependencyMismatch(
            `Dependency mismatch for ${reason.function} at index ${i}: expected ${expectedDep}, found ${foundType} (ref ${depRef})`
          );
          return false;
        }
      }
    }
  }

  return true;
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

// Proof-step numbers must be unique and consecutive (e.g. [01]–[04] or legacy [04]–[10]).
// Given (`[g_nn]`) and diagram (`[d_nn]`) premises use separate namespaces and are excluded here.
export const checkSequentialStepNumbers = (proof: ProofObj): Array<string> => {
  const errors: Array<string> = [];
  const seenStepNumbers = new Set<string>();

  const numberedSteps = proof.steps.filter(
    (step) => step.type === "proof" && step.stepNumber,
  );

  const numeric = (label: string) =>
    parseInt(label.replace(/[[\]]/g, ""), 10);

  const sortedNums = numberedSteps
    .map((s) => ({ label: s.stepNumber!, n: numeric(s.stepNumber!) }))
    .filter((x) => !Number.isNaN(x.n))
    .sort((a, b) => a.n - b.n);

  for (const step of numberedSteps) {
    if (seenStepNumbers.has(step.stepNumber!)) {
      logError.parser.duplicateStepNumbers(step.stepNumber!);
      errors.push(`Duplicate step number: ${step.stepNumber}`);
    } else {
      seenStepNumbers.add(step.stepNumber!);
    }
  }

  if (sortedNums.length !== numberedSteps.length) {
    errors.push("Proof steps have invalid step number labels");
    return errors;
  }

  const start = sortedNums[0].n;
  for (let k = 0; k < sortedNums.length; k++) {
    if (sortedNums[k].n !== start + k) {
      const msg = `Non-consecutive proof step numbers: expected integer ${start + k}, found ${sortedNums[k].label} (${sortedNums[k].n})`;
      logError.parser.nonSequentialStepNumbers(
        `[${String(start + k).padStart(2, "0")}]`,
        sortedNums[k].label,
      );
      errors.push(msg);
    }
  }

  return errors;
};
