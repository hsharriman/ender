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
import { ProofParser } from "./grammar/lezerParser";
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

const extractGoal = (proof: ProofObj) => {
  const goalStep = proof.steps.find((step) => step.type === "goal");
  if (goalStep && goalStep.statement) return goalStep.statement;
  return proof.goal;
};

const emptyProofGraph = (): ProofGraph => {
  return {
    nodes: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    dependencyFailureSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };
};

/**
 * Single checker workflow on an already-parsed proof (after `normalizeProofObj`).
 * Steps: geometric premises → premise geometry context → **build proof graph**
 * (reason structure, deps, statement args, **reason application** — this is where
 * `ProofStep.diagramDeps` is set) → cycles → unused steps → duplicate / step-number
 * checks → goal match.
 */
export const runProofChecker = (proof: ProofObj): ProofCheckerResult => {
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
};

const parser = new ProofParser();

/** Direct programmatic entry: parse proof text then run checker. */
export const runProofCheckerFromText = (
  proofText: string,
): ProofCheckerResult => {
  const proof = parser.parse(proofText) as unknown as ProofObj;
  return runProofChecker(proof);
};

/** Console logger for checker output (kept in this module for direct use). */
export const logProofCheckerResult = (result: ProofCheckerResult): void => {
  const {
    proof,
    goal,
    graph,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
    goalMatchResult,
  } = result;

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
    `   • Total Steps: ${proof.steps.filter((s) => s.type !== "goal").length}`,
  );
  console.log(
    `   • Given Statements: ${proof.steps.filter((s) => s.type === "given").length}`,
  );
  console.log(
    `   • Proof Steps: ${proof.steps.filter((s) => s.type === "proof").length}`,
  );
  if (graph.incorrectSteps.size > 0) {
    console.log(`\n❌ Incorrect Steps: ${graph.incorrectSteps.size}`);
    Array.from(graph.incorrectSteps)
      .sort()
      .forEach((step) => {
        const depFail = graph.dependencyFailureSteps?.has(step);
        console.log(
          depFail
            ? `   • Step ${step} (fails due to dependency on incorrect step)`
            : `   • Step ${step}`,
        );
      });
  }
  console.log(`\n🚫 Unused Steps: ${graph.unusedSteps.size}`);
  console.log(`\n🔄 Cycles: ${graph.cycles.length}`);
  console.log(`\n🔄 Duplicate Steps: ${duplicateSteps.length}`);
  console.log(`\n📝 Step Number Errors: ${stepNumberErrors.length}`);
  console.log(`\n🔷 Geometric Object Errors: ${geometricObjectErrors.length}`);
};

/**
 * Convenience API: accepts either already-parsed `ProofObj` or raw proof text.
 * Runs checker and logs result summary to console.
 */
export const checkProof = (input: ProofObj | string): ProofCheckerResult => {
  const result =
    typeof input === "string"
      ? runProofCheckerFromText(input)
      : runProofChecker(input);
  logProofCheckerResult(result);
  return result;
};
