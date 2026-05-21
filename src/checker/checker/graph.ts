import { ProofContent } from "geometry-object";
import {
  ProofGraph,
  ProofObj,
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
} from "../types/checkerTypes";
import {
  createReasonApplicabilityIndex,
  indexProofStepForReasons,
} from "./reasonFulfillment";
import { checkReasonApplication } from "./reasonApplication";
import { waysToProve } from "./waysToProve";
import {
  checkReasonDependencies,
  checkReasonStructure,
  checkStatementArguments,
} from "./validators";

// Build proof graph and check each step
export const buildProofGraph = (
  proof: ProofObj,
  reasonDefs: Map<string, ReasonDefinition>,
  stmtDefs: Map<string, StatementDefinition>,
  groups: Map<string, StatementGroup>,
  ctx: ProofContent,
): ProofGraph => {
  const graph: ProofGraph = {
    nodes: new Map(),
    diagramPremises: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    dependencyFailureSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };

  // Add all steps to the graph (skip goal steps)
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum = step.stepNumber;
    if (stepNum) {
      graph.nodes.set(stepNum, step);
      graph.edges.set(stepNum, []);
    }
  });

  // Add diagram premises for direct lookup by step number.
  proof.premises.diagramStatements.forEach((d) => {
    graph.diagramPremises.set(d.stepNumber, d);
  });
  const reasonIndex = createReasonApplicabilityIndex(graph);

  // Check each step and build edges
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum = step.stepNumber;

    if (!stepNum) return;

    let isCorrect = true;

    if (step.type === "proof" && step.reason && step.statement) {
      step.waysToProve = waysToProve(step, ctx);
    }

    if (step.type === "given") {
      // Given statements are assumed to be true, but check format
      if (step.statement?.function) {
        // For now, just check if the function exists in definitions
        // In a real implementation, you'd check the actual statement format
        isCorrect = stmtDefs.has(step.statement.function);
      }
    } else if (step.type === "proof" && step.reason && step.statement) {
      // Check reason dependencies
      isCorrect = checkReasonStructure(step, reasonDefs, groups, graph);

      // Validate dependency statements (non-throwing version)
      if (isCorrect) {
        isCorrect = checkReasonDependencies(
          step.reason,
          reasonDefs,
          groups,
          graph,
          step,
        );
      }

      // Proof steps may only cite earlier numbered proof steps (not self / future).
      if (isCorrect && step.reason.arguments) {
        const currN = parseInt(stepNum, 10);
        if (!Number.isNaN(currN)) {
          for (const depRef of step.reason.arguments) {
            if (/^\d+$/.test(depRef)) {
              const depN = parseInt(depRef, 10);
              if (!Number.isNaN(depN) && depN >= currN) {
                isCorrect = false;
                break;
              }
            }
          }
        }
      }

      // Given premises `g_n` may only appear in `given(...)` reasons.
      if (
        isCorrect &&
        step.reason.function !== "given" &&
        step.reason.arguments
      ) {
        for (const depRef of step.reason.arguments) {
          if (/^g_\d+$/.test(depRef)) {
            step.errors.push({
              type: "illegal_given_dep",
              data: {
                reason: step.reason.function,
                ref: depRef,
              },
            });
            isCorrect = false;
            break;
          }
        }
      }

      // Check statement
      if (isCorrect) {
        isCorrect = checkStatementArguments(step.statement, stmtDefs);

        // Check if premises-only statement is used in proof step
        if (isCorrect && step.statement?.function) {
          const stmtDef = stmtDefs.get(step.statement.function);
          if (stmtDef?.isPremisesOnly && step.type === "proof") {
            step.errors.push({
              type: "reason_stmt_mismatch",
              data: {
                reason: step.reason.function,
                message: `Statement '${step.statement.function}' is only allowed in premises, not in proof steps`,
              },
            });
            isCorrect = false;
          }
        }
      }

      // Check if any dependencies are incorrect
      if (isCorrect && step.reason.arguments) {
        const incorrectDeps = step.reason.arguments
          .map((depRef) => depRef)
          .filter((depStepNum) => graph.incorrectSteps.has(depStepNum));
        const hasIncorrectDependency = incorrectDeps.length > 0;

        if (hasIncorrectDependency) {
          isCorrect = false;
          graph.dependencyFailureSteps.add(stepNum);
          step.errors.push({
            type: "upstream_dep_error",
            data: {
              reason: step.reason.function,
              dependsOn: incorrectDeps,
            },
          });
        }
      }

      // Check if reason is applied correctly using reason checker methods
      if (isCorrect) {
        isCorrect = checkReasonApplication(step, reasonDefs, graph, ctx);
      }

      // Add edges from dependencies to this step
      if (step.reason.arguments) {
        step.reason.arguments.forEach((depRef) => {
          const edges = graph.edges.get(depRef) || [];
          edges.push(stepNum);
          graph.edges.set(depRef, edges);
        });
      }
    }

    if (!isCorrect) {
      graph.incorrectSteps.add(stepNum);
    }
    indexProofStepForReasons({ step, stepNum, isCorrect, index: reasonIndex });
  });

  return graph;
};

// Check for cycles in the graph using DFS
export const detectCycles = (graph: ProofGraph): string[][] => {
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
export const findUnusedSteps = (
  graph: ProofGraph,
  goalStep?: string,
): Set<string> => {
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
