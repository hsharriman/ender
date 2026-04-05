import {
  buildProofGraph,
  detectCycles,
  findUnusedSteps,
} from "./checker/graph";
import { buildPremises } from "./checker/premises";
import {
  checkGeometricObjects,
  checkGoalMatch,
  checkSequentialStepNumbers,
  findDuplicateSteps,
} from "./checker/validators";
import { logDebug } from "./errors/errorConstants";
import { loadReasonDefinitionsWithBuiltins } from "./grammar/reasonParser";
import { loadStatementDefinitions } from "./grammar/stmtParser";
import { ProofGraph, ProofObj, Stmt } from "./types/checkerTypes";

export type ProofGoalMatchResult = { matches: boolean; details: string };

export type ProofCheckerResult = {
  proof: ProofObj;
  goal: Stmt | undefined;
  graph: ProofGraph;
  duplicateSteps: Array<[string, string]>;
  stepNumberErrors: string[];
  geometricObjectErrors: string[];
  goalMatchResult: ProofGoalMatchResult;
};

function extractGoal(proof: ProofObj) {
  const goalStep = proof.steps.find((step) => step.type === "goal");
  if (goalStep && goalStep.statement) return goalStep.statement;
  return proof.goal;
}

function emptyProofGraph(): ProofGraph {
  return {
    nodes: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    dependencyFailureSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };
}

/**
 * Single checker workflow on an already-parsed proof (after `normalizeProofObj`).
 * Steps: geometric premises → premise geometry context → **build proof graph**
 * (reason structure, deps, statement args, **reason application** — this is where
 * `ProofStep.diagramDeps` is set) → cycles → unused steps → duplicate / step-number
 * checks → goal match.
 */
export function runProofChecker(proof: ProofObj): ProofCheckerResult {
  const goal = extractGoal(proof);
  proof.errors = [];

  const geometricObjectErrors = checkGeometricObjects(proof);
  if (geometricObjectErrors.length > 0) {
    return {
      proof,
      goal,
      graph: emptyProofGraph(),
      duplicateSteps: [],
      stepNumberErrors: [],
      geometricObjectErrors,
      goalMatchResult: { matches: false, details: "skipped (geometry errors)" },
    };
  }

  const ctx = buildPremises(proof);
  logDebug("checking angle overlaps");
  ctx.checkAngleOverlaps();

  const reasonDefs = loadReasonDefinitionsWithBuiltins();
  const { statements: stmtDefs, groups } = loadStatementDefinitions();

  logDebug("Building proof graph (reason application; diagram deps)...");
  const graph = buildProofGraph(proof, reasonDefs, stmtDefs, groups, ctx);

  graph.cycles = detectCycles(graph);

  const lastProofStep = proof.steps
    .slice()
    .reverse()
    .find((step) => step.type === "proof");
  const lastStepNum = lastProofStep?.stepNumber?.replace(/[[\]]/g, "");
  graph.unusedSteps = findUnusedSteps(graph, lastStepNum);

  const duplicateSteps = findDuplicateSteps(proof);
  const stepNumberErrors = checkSequentialStepNumbers(proof);
  const goalMatchResult = checkGoalMatch(proof, goal);

  return {
    proof,
    goal,
    graph,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
    goalMatchResult,
  };
}
