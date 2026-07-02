import { ProofContent } from "../geometry-object";
import {
  buildProofGraph,
  detectCycles,
  findUnusedSteps,
} from "./checker/graph";
import { buildPremises } from "./checker/premises";
import {
  checkDiagramPremiseTypes,
  checkGeometricObjects,
  checkGoalMatch,
  checkSequentialStepNumbers,
  findDuplicateSteps,
} from "./checker/validators";
import {
  loadReasonDefinitions,
  loadStatementDefinitions,
} from "./grammar/defsParsers";
import { ProofParser } from "./grammar/lezerParser";
import {
  ErrorDetails,
  ProofGraph,
  ProofObj,
  ProofStep,
  Stmt,
} from "./types/checkerTypes";

export type ProofGoalMatchResult = { matches: boolean; details: string };

export type ProofCheckerResult = {
  proof: ProofObj;
  goal: Stmt | undefined;
  graph: ProofGraph;
  ctx: ProofContent;
  duplicateSteps: Array<[string, string]>;
  stepNumberErrors: string[];
  geometricObjectErrors: string[];
  goalMatchResult: ProofGoalMatchResult;
  errors: ErrorDetails[];
};

const extractGoal = (proof: ProofObj) => {
  const goalStep = proof.steps.find((step) => step.type === "goal");
  if (goalStep && goalStep.statement) return goalStep.statement;
  return proof.goal;
};

const emptyProofGraph = (): ProofGraph => {
  return {
    nodes: new Map(),
    diagramPremises: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    dependencyFailureSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };
};

const isCorrect = (
  goalMatchResult: ProofGoalMatchResult,
  graph: ProofGraph,
  duplicateSteps: Array<[string, string]>,
  stepNumberErrors: string[],
  geometricObjectErrors: string[],
): boolean =>
  goalMatchResult.matches &&
  graph.unusedSteps.size === 0 &&
  graph.cycles.length === 0 &&
  duplicateSteps.length === 0 &&
  stepNumberErrors.length === 0 &&
  geometricObjectErrors.length === 0 &&
  graph.incorrectSteps.size === 0;

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
  const { ctx, premiseErrors } = buildPremises(proof);
  ctx.checkAngleOverlaps();

  const { statements: stmtDefs, groups } = loadStatementDefinitions();

  const geometricObjectErrors = [
    ...checkGeometricObjects(proof, ctx, stmtDefs),
    ...premiseErrors,
  ];
  if (geometricObjectErrors.length > 0) {
    // TODO move to errors object
    proof.isCorrect = false;
    return {
      proof,
      goal,
      graph: emptyProofGraph(),
      ctx,
      duplicateSteps: [],
      stepNumberErrors: [],
      errors: [],
      geometricObjectErrors,
      goalMatchResult: { matches: false, details: "skipped (geometry errors)" },
    };
  }

  const reasonDefs = loadReasonDefinitions();

  const diagramPremiseErrors = checkDiagramPremiseTypes(proof, stmtDefs);
  if (diagramPremiseErrors.length > 0) {
    // TODO move to errors object
    proof.isCorrect = false;
    return {
      proof,
      goal,
      graph: emptyProofGraph(),
      ctx,
      duplicateSteps: [],
      stepNumberErrors: [],
      errors: [],
      geometricObjectErrors: diagramPremiseErrors,
      goalMatchResult: {
        matches: false,
        details: "skipped (diagram premise errors)",
      },
    };
  }

  const graph = buildProofGraph(proof, reasonDefs, stmtDefs, groups, ctx);

  graph.cycles = detectCycles(graph);

  const lastProofStep = proof.steps
    .slice()
    .reverse()
    .find((step) => step.type === "proof");
  const lastStepNum = lastProofStep?.stepNumber;
  graph.unusedSteps = findUnusedSteps(graph, lastStepNum);

  const duplicateSteps = findDuplicateSteps(proof);
  const stepNumberErrors = checkSequentialStepNumbers(proof);
  const goalMatchResult = checkGoalMatch(proof, goal);

  proof.isCorrect = isCorrect(
    goalMatchResult,
    graph,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
  );

  return {
    proof,
    goal,
    graph,
    ctx,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
    goalMatchResult,
    errors: [], // TODO move other errors to errors object
  };
};

const parser = new ProofParser();

/** Direct programmatic entry: parse proof text then run checker. */
export const runProofCheckerFromText = (
  proofText: string,
): ProofCheckerResult => {
  const parseResult = parser.parse(proofText);
  if (!parseResult.ok) {
    // TODO this should all just return false and or a shallow error object
    const emptyProof: ProofObj = {
      title: null,
      premises: {
        points: [],
        triangles: [],
        quadrilaterals: [],
        segments: [],
        angles: [],
        circles: [],
        diagramStatements: [],
      },
      steps: [],
      errors: [],
      isCorrect: false,
    };
    return {
      proof: emptyProof,
      goal: undefined,
      graph: emptyProofGraph(),
      ctx: new ProofContent(),
      duplicateSteps: [],
      stepNumberErrors: [],
      geometricObjectErrors: [],
      goalMatchResult: { matches: false, details: "skipped (parse error)" },
      errors: parseResult.failure,
    };
  }
  return runProofChecker(parseResult.value);
};

const formatStepErrors = (errors: ProofStep["errors"] | undefined): string => {
  if (!errors?.length) return "(no step.errors payload)";
  return errors
    .map((e, i) => {
      const suffix =
        e.details === undefined ? "" : `: ${JSON.stringify(e.details)}`;
      return `  ${i + 1}. ${e.code}${suffix}`;
    })
    .join("\n");
};

/** Proof-wide and per-step issues in the same shape the harness surfaces. */
export const collectProofCheckerIssues = (
  result: ProofCheckerResult,
): string[] => {
  const issues: string[] = [];
  const {
    graph,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
    goalMatchResult,
    proof,
  } = result;

  if (!goalMatchResult.matches) {
    issues.push(`Goal not reached: ${goalMatchResult.details}`);
  }
  if (graph.unusedSteps.size > 0) {
    issues.push(
      `Unused steps: ${Array.from(graph.unusedSteps).sort().join(", ")}`,
    );
  }
  if (graph.cycles.length > 0) {
    issues.push(
      `Cycles: ${graph.cycles.map((c) => c.join(" -> ")).join(" | ")}`,
    );
  }
  if (duplicateSteps.length > 0) {
    issues.push(
      `Duplicate steps: ${duplicateSteps
        .map(([a, b]) => `${a} & ${b}`)
        .join(", ")}`,
    );
  }
  if (stepNumberErrors.length > 0) {
    issues.push(`Step numbering issues: ${stepNumberErrors.join(" | ")}`);
  }
  if (geometricObjectErrors.length > 0) {
    issues.push(
      `Geometric object issues: ${geometricObjectErrors.join(" | ")}`,
    );
  }
  if (graph.incorrectSteps.size > 0) {
    const sorted = Array.from(graph.incorrectSteps).sort();
    issues.push(`Incorrect steps: ${sorted.join(", ")}`);
    for (const stepNum of sorted) {
      const step = proof.steps.find((s) => s.stepNumber === stepNum);
      issues.push(`Step ${stepNum}:\n${formatStepErrors(step?.errors)}`);
    }
  }

  return issues;
};

/**
 * Convenience API: accepts either already-parsed `ProofObj` or raw proof text.
 */
export const checkProof = (input: ProofObj | string): ProofCheckerResult => {
  return typeof input === "string"
    ? runProofCheckerFromText(input)
    : runProofChecker(input);
};
