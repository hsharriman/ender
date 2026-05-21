import { ProofPlanChainRecord } from "./proofPlan";
import { ProofObj, ProofStep, Stmt } from "../types/checkerTypes";

export type SolverOpts = {
  /** Max backward-planning depth (reason rows to add). */
  maxDepth?: number;
  /** Max distinct proof plans to try in the forward pass. */
  maxPlans?: number;
  /** Stop backward planning after the first complete plan; forward stops on first success. */
  stopAfterFirstPlan?: boolean;
  /** Max candidate proof rows per planned step. */
  maxCandidatesPerStep?: number;
  /** Cap child plans per dependency slot during backward planning. */
  maxChildPlans?: number;
  /** Record up to this many backward candidate chains (for stats logging). */
  logBackwardChains?: number;
  /**
   * When true, backward planning may use `cpctc` for `con_seg` subgoals (e.g. goal
   * `con_seg` via CPCTC). `solve` retries with this set if the first pass fails.
   */
  allowCpctcForCongruentParts?: boolean;
};

export type SolverAttempt = {
  depth: number;
  reason: string;
  refs: string[];
  statement: string;
  passed: boolean;
  errors: string[];
};

/** Counts from backward planning and forward realization. */
export type SolverStats = {
  /** Reason names expanded during backward chaining (per conclusion head). */
  backwardReasonsTried: number;
  /** Distinct proof plans produced by backward chaining. */
  backwardPlansGenerated: number;
  /** Candidate proof rows tried in the forward pass (`trialAppendProofStep`). */
  forwardStepAttempts: number;
  /** Backward candidate chains recorded when `logBackwardChains` is set. */
  backwardChains: ProofPlanChainRecord[];
  /** True when a second pass allowed `cpctc` on congruent part subgoals. */
  cpctcRetryUsed?: boolean;
};

export type SolverResult =
  | {
      status: "solved";
      /** Serialized proof for round-trip / UI. */
      proofText: string;
      /** Checker-validated proof (same content as `proofText` when parsed). */
      checkedProof: ProofObj;
      /** Solver-added `proof` rows on the shortest path, in order. */
      proofSteps: ProofStep[];
      attempts: SolverAttempt[];
      stats: SolverStats;
    }
  | {
      status: "invalid-start";
      errors: string[];
      attempts: SolverAttempt[];
      stats: SolverStats;
    }
  | {
      status: "not-found";
      /** Proof plans attempted in the forward pass. */
      plansTried: number;
      attempts: SolverAttempt[];
      stats: SolverStats;
    }
  | {
      status: "capped";
      /** Proof plans attempted before the plan budget was exhausted. */
      plansTried: number;
      attempts: SolverAttempt[];
      stats: SolverStats;
    };

export type SolverStep = ProofStep & {
  type: "proof";
  reason: NonNullable<ProofStep["reason"]>;
  statement: Stmt;
  stepNumber: string;
};
