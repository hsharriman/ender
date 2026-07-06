// Centralized error messages for thrown errors during premise building.
export type ErrorCode =
  | "stmt_arg_mismatch"
  | "reason_dep_missing"
  | "reason_dep_type_mismatch"
  | "reason_stmt_mismatch"
  | "upstream_dep_error"
  | "reason_objs_not_in_stmt_obj"
  | "illegal_given_dep"
  | "illegal_diagram_dep"
  | "forward_reference"
  | "dupe_stmt_supplied"
  | "object_not_in_premises"
  | "cycle"
  | "unused_step"
  | "duplicate_step"
  | "goal_not_reached";

export enum ErrorType {
  ReasonApplicationFail = 1,
  NoDiagramDepMatch = 2,
  ParserError = 3,
  GoalNotFound = 4,
  UnusedStep = 5,
  UpstreamDependencyError = 6,
  ForwardReference = 7,
  Cycle = 8,
  MissingReasonArg = 9,
  ReasonStmtMismatch = 10,
  InvalidStmtArg = 11,
  InvalidReasonArg = 12,
  InvalidGivenDep = 13,
  InvalidDupeStmt = 14,
  UnexpectedDiagramDep = 15,
  UnclassifiedError = 16,
}

export const ErrorMessages = {
  PARSER: {
    UNKNOWN_STATEMENT_FUNCTION: (stmtFunction: string) =>
      `Unknown statement function: ${stmtFunction}`,
    SEGMENT_ANGLE_OVERLAP_ERROR: (segment: string, angle: string) =>
      `Segment '${segment}' is used in ang_bisect but does not overlap with angle ${angle}`,
    POINT_NOT_DEFINED_IN_PREMISES: (point: string) =>
      `Point '${point}' is used in intersect_seg but not defined in premises`,
    PREMISE_COUNTERPART_REQUIRED: (stmt: string) =>
      `Statement '${stmt}' cannot be used in premises. Try ${stmt}_premise instead.`,
  },
} as const;
