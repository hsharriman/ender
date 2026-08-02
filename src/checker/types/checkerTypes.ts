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

export interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  statement?: Stmt;
  stepNumber?: string;
  diagramDeps?: ParseDiagramStmt[];
  waysToProve?: WaysToProveSummary;
}

export interface ParseDiagramStmt {
  type: "diagram";
  statement: Stmt;
  stepNumber: string;
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
    circles: ParseObj[];
    diagramStatements: ParseDiagramStmt[];
  };
  steps: ProofStep[];
  goal?: Stmt;
}

export type ParsePointObj = ParseObj & {
  pt: [number, number];
  /** Shorthand label offset code (t, tr, r, br, b, bl, l, tl). */
  offsetCode: string;
};
