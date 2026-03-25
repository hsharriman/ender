import { ParseObj } from "geometry-object";

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
  conclusion: string;
}

export interface StatementDefinition {
  name: string;
  parameters: string[];
  isPremisesOnly?: boolean;
  group?: string; // Optional group membership
}

// Types for the proof checker
export interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  statement?: Stmt;
  stepNumber?: string;
}

export interface ParseDiagramStmt {
  type: "diagram";
  statement: Stmt;
  stepNumber: string;
}

export interface ProofObj {
  title: string | null;
  premises: {
    points: ParseObj[];
    triangles: ParseObj[];
    quadrilaterals: ParseObj[];
    segments: ParseObj[];
    angles: ParseObj[];
    diagramStatements: ParseDiagramStmt[];
  };
  steps: ProofStep[];
  goal?: Stmt;
}

export interface ProofGraph {
  nodes: Map<string, ProofStep>;
  edges: Map<string, string[]>;
  incorrectSteps: Set<string>;
  // Steps marked incorrect specifically because they depend on incorrect steps
  dependencyFailureSteps: Set<string>;
  unusedSteps: Set<string>;
  cycles: string[][];
}
