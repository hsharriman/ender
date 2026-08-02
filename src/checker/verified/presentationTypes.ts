export type SurfaceCall = { name: string; arguments: string[] };
export type DisplayPoint = {
  label: string;
  x: string;
  y: string;
  offsetCode: string | null;
};
export type DisplayDeclaration = {
  kind: "segment" | "angle" | "triangle" | "quadrilateral" | "circle";
  objects: string[];
};
export type LabeledSurfaceCall = { label: string; call: SurfaceCall };
export type PresentationStep = {
  label: string;
  reason: SurfaceCall | null;
  conclusion: SurfaceCall | null;
};
export type PresentationFile = {
  title: string | null;
  points: DisplayPoint[];
  declarations: DisplayDeclaration[];
  diagramPremises: LabeledSurfaceCall[];
  givens: LabeledSurfaceCall[];
  goal: SurfaceCall | null;
  steps: PresentationStep[];
};

export type VerifiedIssue = {
  type: number;
  code: string;
  details?: unknown;
};

export type VerifiedCheckOutput =
  | { isCorrect: boolean; issues: VerifiedIssue[] }
  | { isCorrect: false; errors: VerifiedIssue[] };

export type VerifiedDiagnostic = {
  phase: "problem_parsing" | "proof_parsing" | "proof_checking";
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
};
export type VerifiedSuggestion = {
  reason: string;
  slots: Array<{
    status: "satisfied" | "missing" | "conflicting";
    description: string;
    sources: number[];
  }>;
  complete: boolean;
};
export type VerifiedStepReport = {
  number: number;
  source: string;
  reason: string | null;
  conclusion: string | null;
  status: "accepted" | "rejected" | "blocked";
  dependencies: number[];
  diagramDependencies: string[];
  diagnostics: VerifiedDiagnostic[];
  suggestions: VerifiedSuggestion[];
};
export type VerifiedCheckReport = {
  verdict: "failed_to_parse_problem" | "rejected_proof" | "accepted";
  problem: {
    declarations: string[];
    premises: string[];
    conclusion: string;
  } | null;
  presentation: PresentationFile | null;
  steps: VerifiedStepReport[];
  graph: {
    nodes: number[];
    edges: Array<[number, number]>;
    cycles: number[][];
    unusedSteps: number[];
  };
  duplicates: Array<{
    statement: string;
    first: { kind: "premise"; label: string } | { kind: "step"; step: number };
    again: { kind: "premise"; label: string } | { kind: "step"; step: number };
  }>;
  goal: {
    provedBy: number | null;
    diagnostics: VerifiedDiagnostic[];
    suggestions: VerifiedSuggestion[];
  };
  issues: VerifiedIssue[];
  errors: VerifiedIssue[];
  diagnostics: VerifiedDiagnostic[];
};

declare global {
  interface Window {
    enderCheckProof?: (source: string) => string;
    enderParsePresentation?: (source: string) => string;
    enderCheckReport?: (source: string) => string;
  }
}
