import {
  ReasonDefinition,
  StatementDefinition,
  StatementGroup,
} from "../types/checkerTypes";
import { REASONS_DEFS } from "./defs/reasons.defs";
import { STMTS_DEFS } from "./defs/stmts.defs";

let cachedStatementDefinitions:
  | {
      statements: Map<string, StatementDefinition>;
      groups: Map<string, StatementGroup>;
    }
  | undefined;

let cachedReasonDefinitions: Map<string, ReasonDefinition> | undefined;

/** Loads statement defs from bundled `stmts.defs.ts` (source of truth). */
export const loadStatementDefinitions = (): {
  statements: Map<string, StatementDefinition>;
  groups: Map<string, StatementGroup>;
} => {
  if (!cachedStatementDefinitions) {
    cachedStatementDefinitions = {
      statements: new Map<string, StatementDefinition>(
        Object.entries(STMTS_DEFS.statements).map(([k, v]) => [
          k,
          v as unknown as StatementDefinition,
        ]),
      ),
      groups: new Map<string, StatementGroup>(
        Object.entries(STMTS_DEFS.groups).map(([k, v]) => [
          k,
          v as unknown as StatementGroup,
        ]),
      ),
    };
  }
  return cachedStatementDefinitions;
};

export const loadReasonDefinitions = (): Map<string, ReasonDefinition> => {
  if (!cachedReasonDefinitions) {
    cachedReasonDefinitions = new Map<string, ReasonDefinition>(
      Object.entries(REASONS_DEFS).map(([k, v]) => [
        k,
        v as unknown as ReasonDefinition,
      ]),
    );
  }
  return cachedReasonDefinitions;
};
