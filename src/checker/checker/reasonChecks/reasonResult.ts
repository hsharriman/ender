import { ParseDiagramStmt } from "../../types/checkerTypes";

export type DiagramResult =
  | { ok: true; diagramDeps: ParseDiagramStmt[] }
  | { ok: false; failure: { code: string; details?: Record<string, unknown> } };

export const diagramOk = (deps: ParseDiagramStmt[] = []): DiagramResult => ({
  ok: true,
  diagramDeps: deps,
});

export const diagramFail = (
  code: string,
  details?: Record<string, unknown>,
): DiagramResult => ({
  ok: false,
  failure: { code, details },
});

export type ReasonApplicationFailure = {
  code: string;
  details?: Record<string, unknown>;
};

export type ReasonApplicationResult =
  | { ok: true }
  | { ok: false; failure: ReasonApplicationFailure };

export const reasonApplicationOk = (): ReasonApplicationResult => {
  return { ok: true };
};

export const reasonApplicationFail = (
  code: string,
  details?: Record<string, unknown>,
): ReasonApplicationResult => {
  return { ok: false, failure: { code, details } };
};
