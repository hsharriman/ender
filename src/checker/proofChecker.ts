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
import { ErrorType } from "./errors/errorConstants";
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

export type ProofGoalMatchResult = {
  matches: boolean;
  details: string;
  matchedStepNumber?: string;
};

export type ProofCheckerResult = {
  proof: ProofObj;
  goal: Stmt | undefined;
  graph: ProofGraph;
  ctx: ProofContent;
  duplicateSteps: Array<[string, string]>;
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
): boolean =>
  goalMatchResult.matches &&
  graph.cycles.length === 0 &&
  duplicateSteps.length === 0 &&
  graph.incorrectSteps.size === 0;

const emptyProofObj = (): ProofObj => ({
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
});

const emptyResult = (): ProofCheckerResult => {
  return {
    proof: emptyProofObj(),
    goal: undefined,
    graph: emptyProofGraph(),
    ctx: new ProofContent(),
    duplicateSteps: [],
    goalMatchResult: { matches: false, details: "" },
    errors: [],
  };
};

export const runProofChecker = (proof: ProofObj): ProofCheckerResult => {
  const goal = extractGoal(proof);
  proof.errors = [];

  const defaultResult: ProofCheckerResult = { ...emptyResult(), goal };

  const { ctx, premiseErrors } = buildPremises(proof);
  ctx.checkAngleOverlaps();

  const { statements: stmtDefs, groups } = loadStatementDefinitions();

  const dupeStmtErrors = checkGeometricObjects(proof, ctx, stmtDefs);

  if (premiseErrors.length > 0 || dupeStmtErrors.length > 0) {
    proof.isCorrect = false;
    return {
      ...defaultResult,
      ctx,
      errors: [...dupeStmtErrors, ...premiseErrors],
    };
  }

  const reasonDefs = loadReasonDefinitions();

  const diagramPremiseErrors = checkDiagramPremiseTypes(proof, stmtDefs);
  if (diagramPremiseErrors.length > 0) {
    proof.isCorrect = false;
    return {
      ...defaultResult,
      ctx,
      errors: diagramPremiseErrors,
    };
  }

  const graph = buildProofGraph(proof, reasonDefs, stmtDefs, groups, ctx);

  graph.cycles = detectCycles(graph);

  const lastProofStep = proof.steps
    .slice()
    .reverse()
    .find((step) => step.type === "proof");
  const lastStepNum = lastProofStep?.stepNumber;

  const goalMatchResult = checkGoalMatch(proof, goal);
  graph.unusedSteps = findUnusedSteps(
    graph,
    goalMatchResult.matchedStepNumber ?? lastStepNum,
  );

  const duplicateSteps = findDuplicateSteps(proof);
  const stepNumberErrors = checkSequentialStepNumbers(proof);
  if (stepNumberErrors.length > 0) {
    proof.isCorrect = false;
    return {
      ...defaultResult,
      ctx,
      errors: stepNumberErrors,
    };
  }

  proof.isCorrect = isCorrect(goalMatchResult, graph, duplicateSteps);

  return {
    proof,
    goal,
    graph,
    ctx,
    duplicateSteps,
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
    const empty = emptyResult();
    return {
      ...empty,
      errors: parseResult.failure,
      goalMatchResult: {
        ...empty.goalMatchResult,
        details: "parsing failure prevented goal check",
      },
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
  const { graph, duplicateSteps, goalMatchResult, proof, errors } = result;

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
  if (graph.incorrectSteps.size > 0) {
    const sorted = Array.from(graph.incorrectSteps).sort();
    issues.push(`Incorrect steps: ${sorted.join(", ")}`);
    for (const stepNum of sorted) {
      const step = proof.steps.find((s) => s.stepNumber === stepNum);
      issues.push(`Step ${stepNum}:\n${formatStepErrors(step?.errors)}`);
    }
  }
  if (errors.length > 0) {
    issues.push(
      `Checker errors: ${errors
        .map(
          (e) =>
            `${e.code}${e.details ? `: ${JSON.stringify(e.details)}` : ""}`,
        )
        .join(", ")}`,
    );
  }

  return issues;
};

/** Proof-wide and per-step issues as structured ErrorDetails, suitable for machine consumption. */
export const collectProofCheckerErrors = (
  result: ProofCheckerResult,
): ErrorDetails[] => {
  const { graph, duplicateSteps, goalMatchResult, proof, errors } = result;

  if (!goalMatchResult.matches) {
    errors.push({
      type: ErrorType.GoalNotFound,
      code: "goal_not_reached",
      details: { reason: goalMatchResult.details },
    });
  }
  for (const cycle of graph.cycles) {
    errors.push({
      type: ErrorType.Cycle,
      code: "cycle",
      details: { steps: cycle },
    });
  }
  if (graph.unusedSteps.size > 0) {
    const unusedError = {
      type: ErrorType.UnusedStep,
      code: "unused_step",
      details: { steps: [] },
    };
    const goalStepIdx = goalMatchResult.matchedStepNumber
      ? proof.steps.findIndex(
          (s) => s.stepNumber === goalMatchResult.matchedStepNumber,
        )
      : -1;
    const afterGoal: string[] = [];
    const other: string[] = [];
    for (const stepNum of graph.unusedSteps) {
      const idx = proof.steps.findIndex((s) => s.stepNumber === stepNum);
      if (goalStepIdx >= 0 && idx > goalStepIdx) {
        afterGoal.push(stepNum);
      } else {
        other.push(stepNum);
      }
    }
    if (afterGoal.length > 0) {
      errors.push({
        ...unusedError,
        code: "unused_step_goal_already_met",
        details: { steps: afterGoal.sort() },
      });
    }
    if (other.length > 0) {
      errors.push({ ...unusedError, details: { steps: other.sort() } });
    }
  }
  for (const [a, b] of duplicateSteps) {
    errors.push({
      type: ErrorType.InvalidDupeStmt,
      code: "duplicate_step",
      details: { steps: [a, b] },
    });
  }
  for (const stepNum of Array.from(graph.incorrectSteps).sort()) {
    const step = proof.steps.find((s) => s.stepNumber === stepNum);
    if (step?.errors?.length) {
      for (const error of step.errors) {
        error.details = { ...error.details, steps: [stepNum] };
        errors.push(error);
      }
    }
  }

  return errors;
};

/**
 * Convenience API: accepts either already-parsed `ProofObj` or raw proof text.
 */
export const checkProof = (input: ProofObj | string): ProofCheckerResult => {
  return typeof input === "string"
    ? runProofCheckerFromText(input)
    : runProofChecker(input);
};
