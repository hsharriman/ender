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

export interface WaysToProveSlot {
  slotId: string;
  expected: string;
  state: "matched" | "missing" | "conflicting";
  sourceRef?: string;
  visualRef?: string;
  visualRefs?: string[];
}

export interface WaysToProveCandidate {
  reasonFunction: string;
  templateId: string;
  completion: number;
  slots: WaysToProveSlot[];
  dependencyRefs: string[];
  diagramRefs: string[];
  statementRefs: string[];
  contributors: string[];
}

export interface WaysToProveSummary {
  reasonFunction: string;
  totalSlots: number;
  matchedSlots: number;
  candidates: WaysToProveCandidate[];
}

export interface StatementGroup {
  name: string;
  base: string; // The base statement that can be substituted for
  extensions: string[]; // Statements that can substitute for the base
}

export interface ReasonDefinition {
  name: string;
  title: string;
  body: string;
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
  | "reason_dep_type_mismatch"
  | "reason_stmt_mismatch"
  | "upstream_dep_error"
  | "reason_objs_not_in_stmt_obj"
  | "illegal_given_dep"
  | "object_not_in_premises"
  | "cycle"
  | "unused_step"
  | "duplicate_step"
  | "goal_not_reached";

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
  diagramDeps?: ParseDiagramStmt[];
  waysToProve?: WaysToProveSummary;
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
  isCorrect: boolean;
}

export type ParsePointObj = ParseObj & {
  pt: [number, number];
  /** Shorthand label offset code (t, tr, r, br, b, bl, l, tl). */
  offsetCode: string;
};

export interface ProofGraph {
  nodes: Map<string, ProofStep>;
  diagramPremises: Map<string, ParseDiagramStmt>;
  edges: Map<string, string[]>;
  incorrectSteps: Set<string>;
  // Steps marked incorrect specifically because they depend on incorrect steps
  dependencyFailureSteps: Set<string>;
  unusedSteps: Set<string>;
  cycles: string[][];
}
