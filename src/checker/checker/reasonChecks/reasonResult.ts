export type DiagramResult = {
  res: CheckerResult;
  diagramDeps: ParseDiagramStmt[];
};

import { ParseDiagramStmt } from "checker/types/checkerTypes";

export const diagramOk = (deps: ParseDiagramStmt[] = []): DiagramResult => ({
  res: { ok: true },
  diagramDeps: deps,
});

export const diagramFail = (
  code: string,
  details?: Record<string, unknown>,
): DiagramResult => ({
  res: {
    ok: false,
    failure: { type: ErrorCode.NoDiagramDepMatch, code, details },
  },
  diagramDeps: [],
});

export enum ErrorCode {
  ReasonApplicationFail = 1,
  NoDiagramDepMatch = 2,
}

export type CheckerResult = { ok: true } | { ok: false; failure: ErrorDetails };

export const reasonApplicationOk = (): CheckerResult => {
  return { ok: true };
};

export type ErrorDetails = {
  type: ErrorCode;
  code: string;
  details?: Record<string, unknown>;
};

export const reasonApplicationFail = (
  code: string,
  details?: Record<string, unknown>,
): CheckerResult => {
  return {
    ok: false,
    failure: { type: ErrorCode.ReasonApplicationFail, code, details },
  };
};
