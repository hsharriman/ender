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

export interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  statement?: Stmt;
  stepNumber?: string;
  diagramDeps?: ParseDiagramStmt[];
}

export interface ParseDiagramStmt {
  type: "diagram";
  statement: Stmt;
  stepNumber: string;
}

export interface ProofObj {
  title: string | null;
  premises: {
    points: ParsePointObj[];
    triangles: ParseObj[];
    quadrilaterals: ParseObj[];
    segments: ParseObj[];
    angles: ParseObj[];
    circles: ParseObj[];
    arcs: ParseObj[];
    diagramStatements: ParseDiagramStmt[];
  };
  steps: ProofStep[];
  goal?: Stmt;
  /**
   * The checker's ray representatives, keyed vertex then point (`"PT"`):
   * angles whose sides map to the same points are drawn as one angle.
   */
  rays: Map<string, string>;
}

export type ParsePointObj = ParseObj & {
  pt: [number, number];
  /** Shorthand label offset code (t, tr, r, br, b, bl, l, tl). */
  offsetCode: string;
};
