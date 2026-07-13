import { Stmt } from "checker/types/checkerTypes";

export interface SolverOptions {
  /** Max distinct verified solutions to return (default 3). */
  maxSolutions?: number;
  /** Max backward-chaining depth (default 8). */
  maxDepth?: number;
  /** Hard cap on single-step reason checks (default 20000). */
  maxCheckerCalls?: number;
  /** Wall-clock budget for the whole solve (default 12000 ms). */
  timeLimitMs?: number;
  /** Max derivations recorded per fact — the OR branching factor (default 4). */
  maxDerivationsPerFact?: number;
  /** Max derivation-choice assignments explored during extraction (default 64). */
  maxExtractionCombos?: number;
}

export interface SolverStats {
  totalMs: number;
  seedMs: number;
  searchMs: number;
  extractMs: number;
  verifyMs: number;
  /** Single-step `checkReasonApplication` calls made during search. */
  checkerCalls: number;
  /** Full `runProofChecker` passes (1 seed + 1 per candidate solution). */
  fullCheckerRuns: number;
  factsCreated: number;
  derivationsRecorded: number;
  subgoalsOpened: number;
  memoHits: number;
  solutionsExtracted: number;
  solutionsVerified: number;
  budgetExhausted: boolean;
}

export type FactSource = "given" | "existing" | "derived";

export interface SolverDerivationJson {
  reason: string;
  /** Fact ids of the dependencies, slot order. */
  deps: string[];
  /** Diagram premise refs consumed (e.g. d_1). */
  diagramRefs: string[];
}

export interface SolverFactJson {
  id: string;
  /** Human-readable statement, e.g. con_seg(AM, BM). */
  text: string;
  source: FactSource;
  /** Premise ref (g_n) for given facts. */
  givenRef?: string;
  derivations: SolverDerivationJson[];
  /** True when this fact is part of the goal's derivation cone. */
  inGoalCone: boolean;
}

/** Serializable AND-OR derivation graph rooted at the goal. */
export interface SolutionTreeJson {
  goalFactId?: string;
  facts: SolverFactJson[];
}

export interface SolutionStep {
  stepNumber: string;
  reason: string;
  refs: string[];
  text: string;
}

export interface Solution {
  steps: SolutionStep[];
  proofText: string;
  verified: boolean;
  issues: string[];
}

export interface SolverResult {
  ok: boolean;
  error?: string;
  goalText?: string;
  /** Verified solutions, at most maxSolutions. */
  solutions: Solution[];
  tree: SolutionTreeJson;
  stats: SolverStats;
  seed: {
    givens: number;
    diagramPremises: number;
    existingStepsSeeded: number;
    droppedInvalidSteps: string[];
  };
}

export interface SolverDerivation {
  reason: string;
  depFactIds: string[];
  diagramRefs: string[];
}

export interface SolverFact {
  id: string;
  /** Ref used in the synthetic proof graph (g_n for givens, f<n> otherwise). */
  ref: string;
  stmt: Stmt;
  key: string;
  source: FactSource;
  givenRef?: string;
  derivations: SolverDerivation[];
}
