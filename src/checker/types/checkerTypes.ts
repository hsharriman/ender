import { ParseObj } from "../../geometry-object";

export interface Stmt {
  function: string;
  arguments: ParseObj[];
  stepNumber?: string;
}

export interface Reason {
  function: string;
  arguments: string[];
}

export interface StatementGroup {
  name: string;
  base: string; // The base statement that can be substituted for
  extensions: string[]; // Statements that can substitute for the base
}

export interface ReasonDefinition {
  name: string;
  dependencies: (string | StatementGroup)[]; // Can be statement name or group
  /** Dependencies satisfied via `premises.diagramStatements` (not passed as proof-step args). */
  diagramDependencies?: (string | StatementGroup)[];
  conclusion: string;
}

export interface StatementDefinition {
  name: string;
  parameters: string[];
  isPremisesOnly?: boolean;
  group?: string; // Optional group membership
}

export type ErrorType =
  | "stmt_arg_mismatch"
  | "reason_dep_missing"
  | "reason_dep_mismatch"
  | "reason_stmt_mismatch"
  | "dependency_error"
  | "reason_deps_impl"
  | "reason_objs_not_in_stmt_obj"
  | "object_not_in_premises"
  | "cycle"
  | "unused_step"
  | "duplicate_step"
  | "goal_not_reached"
  | "reason_check";

export type ErrorObj = {
  type: ErrorType;
  data?: any;
};

export type ReasonCheckResult = {
  ok: boolean;
  errors: ErrorObj[];
};

// Types for the proof checker
// errors here:
export interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  statement?: Stmt;
  stepNumber?: string;
  errors: ErrorObj[];
}

// errors here: invalid diagram statement (can't find objects in premises)
export interface ParseDiagramStmt {
  type: "diagram";
  statement: Stmt;
  stepNumber: string;
  errors: ErrorObj[];
}

// errors here: cycles, unused steps, duplicate steps, goal not reached
export interface ProofObj {
  title: string | null;
  premises: {
    points: ParsePointObj[];
    triangles: ParseObj[];
    quadrilaterals: ParseObj[];
    segments: ParseObj[];
    angles: ParseObj[];
    diagramStatements: ParseDiagramStmt[];
  };
  steps: ProofStep[];
  goal?: Stmt;
  errors: ErrorObj[];
}

export type ParsePointObj = ParseObj & {
  pt: [number, number];
  offset: [number, number];
};

export interface ProofGraph {
  nodes: Map<string, ProofStep>;
  edges: Map<string, string[]>;
  incorrectSteps: Set<string>;
  // Steps marked incorrect specifically because they depend on incorrect steps
  dependencyFailureSteps: Set<string>;
  unusedSteps: Set<string>;
  cycles: string[][];
}
