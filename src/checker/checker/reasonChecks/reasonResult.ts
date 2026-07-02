import {
  CheckerResult,
  ErrorType,
  ParseDiagramStmt,
} from "checker/types/checkerTypes";

export type { CheckerResult, ErrorDetails } from "checker/types/checkerTypes";

export type DiagramResult = {
  res: CheckerResult;
  diagramDeps: ParseDiagramStmt[];
};

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
    failure: { type: ErrorType.NoDiagramDepMatch, code, details },
  },
  diagramDeps: [],
});

export const reasonApplicationOk = (): CheckerResult => {
  return { ok: true };
};

export const reasonApplicationFail = (
  code: string,
  details?: Record<string, unknown>,
): CheckerResult => {
  return {
    ok: false,
    failure: { type: ErrorType.ReasonApplicationFail, code, details },
  };
};
