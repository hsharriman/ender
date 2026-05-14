import { ProofObj, ProofStep, Stmt } from "../types/checkerTypes";

export type SolverOpts = {
  maxDepth?: number;
  maxStates?: number;
  maxCandidatesPerState?: number;
};

export type SolverAttempt = {
  depth: number;
  reason: string;
  refs: string[];
  statement: string;
  passed: boolean;
  errors: string[];
};

export type SolverState = {
  proof: ProofObj;
  steps: ProofStep[];
  depth: number;
};

export type SolverResult =
  | {
      status: "solved";
      steps: ProofStep[];
      checkedProof: ProofObj;
      /** Pretty-printed proof DAG (facts + incoming edges). */
      dagText: string;
      attempts: SolverAttempt[];
    }
  | { status: "invalid-start"; errors: string[]; attempts: SolverAttempt[] }
  | {
      status: "not-found";
      searched: number;
      depth: number;
      attempts: SolverAttempt[];
    }
  | {
      status: "capped";
      searched: number;
      depth: number;
      attempts: SolverAttempt[];
    };

export type SolverStep = ProofStep & {
  type: "proof";
  reason: NonNullable<ProofStep["reason"]>;
  statement: Stmt;
  stepNumber: string;
};
