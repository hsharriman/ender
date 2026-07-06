import { ErrorType } from "checker/errors/errorConstants";
import { getGeometricObject } from "checker/utils/utils";
import { Obj, ParseObj, ProofContent } from "../../geometry-object";
import {
  ErrorDetails,
  ProofGraph,
  ProofObj,
  ProofStep,
  Reason,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
  Stmt,
} from "../types/checkerTypes";
// import {
//   collectCircleShapeErrorMessages,
//   formatCircleToken,
//   getCirclePointLabels,
//   stripCirclePrefix,
// } from "../utils/circleValidation";

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
      type: ErrorType.ReasonStmtMismatch,
      code: "reason_stmt_mismatch",
      details: {
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
      type: ErrorType.StmtArgNumArgsIncorrect,
      code: "stmt_arg_num_args_incorrect",
      details: {
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
        type: ErrorType.StmtArgTypeInvalid,
        code: "stmt_arg_type_invalid",
        details: {
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
          ? ErrorType.MissingReasonArg
          : ErrorType.InvalidReasonArg,
      code:
        isCountMismatch || isMissingDependencyRef
          ? "reason_dep_missing"
          : "reason_dep_type_mismatch",
      details: data,
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
        type: ErrorType.ReasonStmtMismatch,
        code: "reason_stmt_mismatch",
        details: {
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

const argExistsInCtx = (arg: ParseObj, ctx: ProofContent): boolean => {
  switch (arg.type) {
    case Obj.Angle:
      return !!ctx.getAngle(arg.v);
    case Obj.Triangle:
      return !!ctx.getTriangle(arg.v);
    case Obj.Quadrilateral:
      return !!ctx.getQuadrilateral(arg.v);
    case Obj.Segment:
      return !!ctx.getSegment(arg.v);
    case Obj.Point:
      return !!ctx.getPoint(arg.v);
    case Obj.Circle:
      return !!ctx.getCircle(arg.v);
    default:
      return false;
  }
};

// Check if geometric objects are well-formed
export const checkGeometricObjects = (
  proof: ProofObj,
  ctx: ProofContent,
  stmtDefs: Map<string, StatementDefinition>,
): Array<ErrorDetails> => {
  const errors: Array<ErrorDetails> = [];

  for (const step of proof.steps) {
    if (!step.statement?.arguments) continue;
    const args = step.statement.arguments;

    // Validate every arg exists in ctx before touching it further.
    let allExist = true;
    for (const arg of args) {
      if (!argExistsInCtx(arg, ctx)) {
        allExist = false;
        errors.push({
          type: ErrorType.InvalidStmtArg,
          code: "object_not_in_premises",
          details: {
            stepNumber: step.stepNumber,
            statement: step.statement.function,
            arg: arg.v,
          },
        });
      }
    }
    if (!allExist) continue;

    // Duplicate argument check: reject statements where two args resolve to the same object.
    const stmtDef = stmtDefs.get(step.statement.function);
    if (stmtDef && !stmtDef.allowDupeArgs) {
      for (let i = 0; i < args.length; i++) {
        for (let j = i + 1; j < args.length; j++) {
          if (args[i].type !== args[j].type) continue;
          if (
            getGeometricObject(args[i], ctx) ===
            getGeometricObject(args[j], ctx)
          ) {
            errors.push({
              type: ErrorType.DupeStmtSupplied,
              code: "duplicate_argument",
              details: {
                statement: step.statement.function,
                stepNumber: step.stepNumber,
                argument: args[i].v,
              },
            });
          }
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
      type: ErrorType.DupeStmtSupplied,
      code: "duplicate_step",
      details: { steps: duplicates },
    });
  }

  return duplicates;
};

// Proof-step numbers must be unique and consecutive (e.g. [01]–[04] or legacy [04]–[10]).
// Given (`g_n`) and diagram (`[d_nn]`) premises use separate namespaces and are excluded here.
export const checkSequentialStepNumbers = (
  proof: ProofObj,
): Array<ErrorDetails> => {
  const errors: Array<ErrorDetails> = [];
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
      errors.push({
        type: ErrorType.StepNumberError,
        code: "duplicate_step_number",
        details: { stepNumber: step.stepNumber },
      });
    } else {
      seenStepNumbers.add(step.stepNumber!);
    }
  }

  if (sortedNums.length !== numberedSteps.length) {
    errors.push({
      type: ErrorType.StepNumberError,
      code: "invalid_step_number_labels",
      details: {},
    });
    return errors;
  }

  if (sortedNums.length === 0) {
    errors.push({
      type: ErrorType.StepNumberError,
      code: "no_step_numbers",
      details: {},
    });
    return errors;
  }

  const start = sortedNums[0].n;
  for (let k = 0; k < sortedNums.length; k++) {
    if (sortedNums[k].n !== start + k) {
      errors.push({
        type: ErrorType.StepNumberError,
        code: "non_consecutive_step_numbers",
        details: {
          expected: start + k,
          found: sortedNums[k].label,
        },
      });
    }
  }

  return errors;
};

/**
 * Validates that every diagram premise (`[d_xx]`) uses a statement that is
 * explicitly marked `isDiagramOnly`.  Non-diagram statements (e.g. `right`,
 * `perp`, `parallelogram`) may only appear as given steps or derived proof
 * steps, not as diagram premises.
 */
export const checkDiagramPremiseTypes = (
  proof: ProofObj,
  stmtDefs: Map<string, StatementDefinition>,
): Array<ErrorDetails> => {
  const errors: Array<ErrorDetails> = [];
  proof.premises.diagramStatements.forEach((d) => {
    const fn = d.statement?.function;
    if (!fn) return;
    const def = stmtDefs.get(fn);
    if (!def?.isDiagramOnly) {
      errors.push({
        type: ErrorType.UnexpectedDiagramDep,
        code: "illegal_diagram_dep",
        details: {
          stepNumber: d.stepNumber,
          statement: fn,
        },
      });
    }
  });
  return errors;
};
