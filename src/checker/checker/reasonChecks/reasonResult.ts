import { ErrorType } from "checker/errors/errorConstants";
import {
  CheckerResult,
  ParseDiagramStmt,
  TriCorrespondence,
} from "checker/types/checkerTypes";

export type {
  CheckerResult,
  ErrorDetails,
  TriCorrespondence,
} from "checker/types/checkerTypes";

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

export const reasonApplicationOk = (
  correspondence?: TriCorrespondence,
): CheckerResult => {
  return correspondence ? { ok: true, correspondence } : { ok: true };
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
