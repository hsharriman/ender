import { Obj, ProofContent } from "../../geometry-object";
import { createError } from "../errors/errorConstants";
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

// Check if statement arguments match the expected parameters
export const checkStatementArguments = (
  stmt: Stmt,
  stmtDefs: Map<string, StatementDefinition>,
): boolean => {
  const definition = stmtDefs.get(stmt.function);
  if (!definition) {
    return false;
  }

  return stmt.arguments.length === definition.parameters.length;
};

/** `given(g_n)` — premise must exist and conclusion must match it. */
export const validateGivenProofStep = (
  step: ProofStep,
  proofGraph: ProofGraph,
): boolean => {
  const reason = step.reason;
  const stmt = step.statement;
  if (!reason || !stmt) {
    return false;
  }
  if (reason.arguments.length !== 1) {
    return false;
  }
  const ref = reason.arguments[0];
  if (/^g_\d+$/.test(ref)) {
    // ok
  } else if (/^d_\d+$/.test(ref)) {
    return false;
  } else if (/^\d+$/.test(ref)) {
    return false;
  } else {
    return false;
  }
  const depStep = proofGraph.nodes.get(ref);
  if (!depStep?.statement) {
    return false;
  }
  const prem = depStep.statement;
  if (prem.function !== stmt.function) {
    step.errors.push({
      type: "reason_stmt_mismatch",
      data: {
        reason: "given",
        legalStatements: [prem.function],
        actualStatement: stmt.function,
        ref,
      },
    });
    return false;
  }
  if (prem.arguments.length !== stmt.arguments.length) {
    step.errors.push({
      type: "reason_stmt_mismatch",
      data: {
        reason: "given",
        legalStatements: [prem.function],
        actualStatement: stmt.function,
        ref,
        expectedArgCount: prem.arguments.length,
        actualArgCount: stmt.arguments.length,
      },
    });
    return false;
  }
  for (let i = 0; i < prem.arguments.length; i++) {
    if (
      prem.arguments[i].type !== stmt.arguments[i].type ||
      prem.arguments[i].v !== stmt.arguments[i].v
    ) {
      step.errors.push({
        type: "reason_stmt_mismatch",
        data: {
          reason: "given",
          legalStatements: [prem.function],
          actualStatement: stmt.function,
          ref,
          argIndex: i,
          expectedArg: prem.arguments[i].v,
          actualArg: stmt.arguments[i].v,
        },
      });
      return false;
    }
  }
  return true;
};

const anyDiagramDepMatch = (
  definition: ReasonDefinition,
  groups: Map<string, StatementGroup>,
  proofGraph: ProofGraph,
) => {
  // Diagram dependencies are satisfied by diagram premises on the proof graph
  // and are not passed as args.
  if (definition.diagramDependencies?.length) {
    for (const expected of definition.diagramDependencies) {
      if (typeof expected !== "string") continue;
      const group = groups.get(expected);
      const anyMatch = Array.from(proofGraph.diagramPremises.values()).some(
        (d) => {
          const foundType = d.statement.function;
          if (group) {
            return (
              group.base === foundType || group.extensions.includes(foundType)
            );
          }
          return foundType === expected;
        },
      );
      if (!anyMatch) {
        return false;
      }
    }
  }
  return true;
};

// Check if reason dependencies match the expected number
export const checkReasonStructure = (
  step: ProofStep,
  reasonDefs: Map<string, ReasonDefinition>,
  groups: Map<string, StatementGroup>,
  proofGraph: ProofGraph,
): boolean => {
  const addDependencyError = (data: {
    reason: string;
    index?: number;
    ref?: string;
    expectedLength?: number;
    receivedLength?: number;
    expectedType?: string;
    receivedType?: string;
    allowedTypes?: string[];
  }) => {
    const isCountMismatch =
      typeof data.expectedLength === "number" &&
      typeof data.receivedLength === "number";
    const isMissingDependencyRef = data.receivedType === "__missing__";
    step.errors.push({
      type:
        isCountMismatch || isMissingDependencyRef
          ? "reason_dep_missing"
          : "reason_dep_type_mismatch",
      data,
    });
  };

  const reason = step.reason;
  const stmt = step.statement;
  if (reason && stmt) {
    let structureOk = true;

    if (reason.function === "given") {
      return validateGivenProofStep(step, proofGraph);
    }

    const definition = reasonDefs.get(reason?.function);
    if (!definition) {
      return false;
    }

    if (reason.arguments.length !== definition.dependencies.length) {
      structureOk = false;
      addDependencyError({
        reason: reason.function,
        expectedLength: definition.dependencies.length,
        receivedLength: reason.arguments.length,
      });
    }

    if (!anyDiagramDepMatch(definition, groups, proofGraph)) {
      structureOk = false;
    }

    for (let idx = 0; idx < reason.arguments.length; idx++) {
      const stepNum = reason.arguments[idx];

      // find either normal proof step or in diagram premises
      const dependencyStmt =
        proofGraph.nodes.get(stepNum)?.statement ||
        proofGraph.diagramPremises.get(stepNum)?.statement;

      const expectedDep = definition.dependencies[idx];

      if (!dependencyStmt) {
        structureOk = false;
        addDependencyError({
          reason: reason.function,
          index: idx,
          ref: stepNum,
          expectedType:
            typeof expectedDep === "string" ? expectedDep : "__unknown__",
          receivedType: "__missing__",
        });
      } else {
        const foundType = dependencyStmt.function;

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
              structureOk = false;
              addDependencyError({
                reason: reason.function,
                index: idx,
                ref: stepNum,
                expectedType: group.base,
                allowedTypes: group.extensions,
                receivedType: foundType,
              });
            }
          } else {
            // Direct statement name match
            if (foundType !== expectedDep) {
              structureOk = false;
              addDependencyError({
                reason: reason.function,
                index: idx,
                ref: stepNum,
                expectedType: expectedDep,
                receivedType: foundType,
              });
            }
          }
        }
      }
    }

    // Handle multiple possible conclusions (separated by commas)
    const possibleConclusions = definition.conclusion
      .split(", ")
      .map((c) => c.trim());

    const nameMatch = reason.function === definition.name;
    const conclusionMatch = possibleConclusions.includes(stmt.function);

    if (!conclusionMatch) {
      structureOk = false;
      step.errors.push({
        type: "reason_stmt_mismatch",
        data: {
          reason: reason.function,
          legalStatements: possibleConclusions,
          actualStatement: stmt.function,
        },
      });
    }

    return structureOk && nameMatch && conclusionMatch;
  }
  return false;
};

// Check if geometric objects are well-formed
export const checkGeometricObjects = (
  proof: ProofObj,
  ctx: ProofContent,
): Array<string> => {
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
        errors.push(
          `Point '${point}' in '${object}' is not defined in premises`,
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
              errors.push(`Segment '${arg.v}' contains duplicate points`);
              break;
            }
            if (!ctx.getSegment(arg.v)) {
              errors.push(
                `Segment '${arg.v}' in step ${step.stepNumber} is not defined in checker context`,
              );
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Angle:
            if (arg.v.length !== 3) {
              errors.push(
                `Invalid angle format: '${arg}' - angles must have exactly 3 points`,
              );
              break;
            }
            if (!ctx.getAngle(arg.v)) {
              errors.push(
                `Angle '${arg.v}' in step ${step.stepNumber} is not defined in checker context`,
              );
            }
            if (hasDuplicateChars(arg.v)) {
              errors.push(`Angle '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Triangle:
            if (arg.v.length !== 3) {
              errors.push(
                `Invalid triangle format: '${arg}' - triangles must have exactly 3 points`,
              );
              if (!ctx.getTriangle(arg.v)) {
                errors.push(
                  `Triangle '${arg.v}' in step ${step.stepNumber} is not defined in checker context`,
                );
              }
              break;
            }
            if (hasDuplicateChars(arg.v)) {
              errors.push(`Triangle '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Quadrilateral:
            if (arg.v.length !== 4) {
              errors.push(
                `Invalid quadrilateral format: '${arg.v}' - quadrilaterals must have exactly 4 points`,
              );
              break;
            }
            if (!ctx.getQuadrilateral(arg.v)) {
              errors.push(
                `Quadrilateral '${arg.v}' in step ${step.statement} is not defined in checker context`,
              );
            }
            if (hasDuplicateChars(arg.v)) {
              errors.push(`Quadrilateral '${arg.v}' contains duplicate points`);
              break;
            }
            checkPointsDefined(arg.v, arg.v.split(""));
            break;
          case Obj.Point:
            if (!definedPoints.has(arg.v)) {
              errors.push(`Point '${arg.v}' is not defined in premises`);
              continue;
            }
            if (!ctx.getPoint(arg.v)) {
              errors.push(
                `Point '${arg.v}' in step ${step.statement} is not defined in checker context`,
              );
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
  goal?: Stmt,
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
  proofGraph: ProofGraph,
): void => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    throw new Error(`Undefined reason: ${reason.function}`);
  }

  if (reason.arguments.length !== definition.dependencies.length) {
    throw new Error(
      `Dependency count mismatch for ${reason.function}: expected ${definition.dependencies.length}, got ${reason.arguments.length}`,
    );
  }

  for (let i = 0; i < reason.arguments.length; i++) {
    const depRef = reason.arguments[i];
    const expectedType = definition.dependencies[i];
    const stepNum = depRef;
    const dependencyStep = proofGraph.nodes.get(stepNum);
    if (!dependencyStep || !dependencyStep.statement) {
      throw new Error(
        `Missing dependency for ${reason.function} at index ${i} (ref ${depRef})`,
      );
    }
    const foundType = dependencyStep.statement.function;
    if (foundType !== expectedType) {
      throw new Error(
        `Dependency mismatch for ${reason.function} at index ${i}: expected ${expectedType}, found ${foundType} (ref ${depRef})`,
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
    return false;
  }

  if (reason.function === "given") {
    if (!fullStep) {
      return false;
    }
    return validateGivenProofStep(fullStep, proofGraph);
  }

  if (reason.arguments.length !== definition.dependencies.length) {
    return false;
  }

  if (!anyDiagramDepMatch(definition, groups, proofGraph)) {
    return false;
  }

  for (let i = 0; i < reason.arguments.length; i++) {
    const stepNum = reason.arguments[i];
    const expectedDep = definition.dependencies[i];
    const dependencyStmt =
      proofGraph.nodes.get(stepNum)?.statement ||
      proofGraph.diagramPremises.get(stepNum)?.statement;

    if (!dependencyStmt) {
      return false;
    }
    const foundType = dependencyStmt.function;

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
          return false;
        }
      } else {
        // Direct statement name match
        if (foundType !== expectedDep) {
          return false;
        }
      }
    }
  }

  return true;
};

// Check for duplicate steps in the proof
export const findDuplicateSteps = (
  proof: ProofObj,
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

  if (duplicates.length > 0) {
    proof.errors.push({
      type: "duplicate_step",
      data: {
        steps: duplicates,
      },
    });
  }

  return duplicates;
};

// Proof-step numbers must be unique and consecutive (e.g. [01]–[04] or legacy [04]–[10]).
// Given (`g_n`) and diagram (`[d_nn]`) premises use separate namespaces and are excluded here.
export const checkSequentialStepNumbers = (proof: ProofObj): Array<string> => {
  const errors: Array<string> = [];
  const seenStepNumbers = new Set<string>();

  const numberedSteps = proof.steps.filter(
    (step) => step.type === "proof" && step.stepNumber,
  );

  const numeric = (label: string) => parseInt(label, 10);

  const sortedNums = numberedSteps
    .map((s) => ({ label: s.stepNumber!, n: numeric(s.stepNumber!) }))
    .filter((x) => !Number.isNaN(x.n))
    .sort((a, b) => a.n - b.n);

  for (const step of numberedSteps) {
    if (seenStepNumbers.has(step.stepNumber!)) {
      errors.push(`Duplicate step number: ${step.stepNumber}`);
    } else {
      seenStepNumbers.add(step.stepNumber!);
    }
  }

  if (sortedNums.length !== numberedSteps.length) {
    errors.push("Proof steps have invalid step number labels");
    return errors;
  }

  if (sortedNums.length === 0) {
    errors.push("No proof steps parsed with leading [nn] step numbers");
    return errors;
  }

  const start = sortedNums[0].n;
  for (let k = 0; k < sortedNums.length; k++) {
    if (sortedNums[k].n !== start + k) {
      const msg = `Non-consecutive proof step numbers: expected integer ${start + k}, found ${sortedNums[k].label} (${sortedNums[k].n})`;
      errors.push(msg);
    }
  }

  return errors;
};
