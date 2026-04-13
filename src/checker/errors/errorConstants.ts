// Error constants for ender-proof-core
// This file centralizes all error messages to ensure consistency and maintainability

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export const ErrorMessages = {
  GEOMETRIC: {
    ANGLE_NOT_FOUND: (arg: string) => `Angle ${arg} not found in context`,
    TRIANGLE_NOT_FOUND: (arg: string) => `Triangle ${arg} not found in context`,
    QUADRILATERAL_NOT_FOUND: (arg: string) =>
      `Quadrilateral ${arg} not found in context`,
    SEGMENT_NOT_FOUND: (arg: string) => `Segment ${arg} not found in context`,
    POINT_NOT_FOUND: (arg: string) => `Point ${arg} not found in context`,
    CANNOT_PARSE_GEOMETRIC_OBJECT: (arg: string) =>
      `Cannot parse geometric object from argument: ${arg}`,
    NO_COMMON_POINT: (seg1: string, seg2: string) =>
      `no common point found for ${seg1} and ${seg2}`,
  },

  PARSER: {
    DEPENDENCY_MISMATCH: (arg: string) => `Dependency mismatch for ${arg}`,
    MISSING_REASON_OR_STATEMENT: "Missing reason or statement",
    UNDEFINED_STATEMENT: (stmtFunction: string) =>
      `Statement '${stmtFunction}' is not defined in stmts.txt`,
    UNDEFINED_REASON: (reasonFunction: string) =>
      `Reason '${reasonFunction}' is not defined in reasons.txt`,
    DUPLICATE_STEPS: (step1: string, step2: string) =>
      `Duplicate steps found: Step ${step1} and Step ${step2} are identical`,
    NON_SEQUENTIAL_STEP_NUMBERS: (expected: string, found: string) =>
      `Non-sequential step numbers: expected Step ${expected}, found Step ${found}`,
    DUPLICATE_STEP_NUMBERS: (stepNumber: string) =>
      `Duplicate step number found: Step ${stepNumber} appears multiple times`,
    INVALID_ANGLE_FORMAT: (angle: string) =>
      `Invalid angle format: '${angle}' - angles must have exactly 3 distinct points`,
    INVALID_TRIANGLE_FORMAT: (triangle: string) =>
      `Invalid triangle format: '${triangle}' - triangles must have exactly 3 distinct points`,
    INVALID_QUADRILATERAL_FORMAT: (quadrilateral: string) =>
      `Invalid quadrilateral format: '${quadrilateral}' - quadrilaterals must have exactly 4 distinct points`,
    UNDEFINED_POINT_IN_OBJECT: (point: string, object: string) =>
      `Point '${point}' in '${object}' is not defined in premises`,
    DUPLICATE_POINTS_IN_OBJECT: (object: string) =>
      `Object '${object}' contains duplicate points`,
    PREMISES_ONLY_STATEMENT_IN_PROOF: (stmtFunction: string) =>
      `Statement '${stmtFunction}' is only allowed in premises section, not in proof steps`,
    UNKNOWN_STATEMENT_FUNCTION: (stmtFunction: string) =>
      `Unknown statement function: ${stmtFunction}`,
    SEGMENT_ANGLE_OVERLAP_ERROR: (segment: string, angle: string) =>
      `Segment '${segment}' is used in ang_bisect but does not overlap with angle ${angle}`,
    POINT_NOT_DEFINED_IN_PREMISES: (point: string) =>
      `Point '${point}' is used in intersect_seg but not defined in premises`,
  },

  PROOF_CHECKER: {
    INCORRECT_STEPS: (count: number) => `Incorrect Steps: ${count}`,
    PROOF_HAS_ISSUES: "Proof has issues that need to be addressed.",
    ERROR_CHECKING_PROOF: (error: any) => `Error checking proof: ${error}`,
  },

  DEBUG: {
    ERROR_PREFIX: "❌",
  },
} as const;

let currentLogLevel: LogLevel = LogLevel.WARN;

export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

const shouldLog = (level: LogLevel): boolean => {
  return level >= currentLogLevel;
};

export const logDebug = (message: string): void => {
  shouldLog(LogLevel.DEBUG) && console.log(message);
};

export const createError = {
  geometric: {
    angleNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.ANGLE_NOT_FOUND(arg)),
    triangleNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.TRIANGLE_NOT_FOUND(arg)),
    quadrilateralNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.QUADRILATERAL_NOT_FOUND(arg)),
    segmentNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.SEGMENT_NOT_FOUND(arg)),
    pointNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.POINT_NOT_FOUND(arg)),
    cannotParseGeometricObject: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.CANNOT_PARSE_GEOMETRIC_OBJECT(arg)),
  },
  parser: {
    unknownStatementFunction: (stmtFunction: string) =>
      new Error(ErrorMessages.PARSER.UNKNOWN_STATEMENT_FUNCTION(stmtFunction)),
    segmentAngleOverlapError: (segment: string, angle: string) =>
      new Error(
        ErrorMessages.PARSER.SEGMENT_ANGLE_OVERLAP_ERROR(segment, angle),
      ),
    pointNotDefinedInPremises: (point: string) =>
      new Error(ErrorMessages.PARSER.POINT_NOT_DEFINED_IN_PREMISES(point)),
  },
} as const;

export const logError = {
  geometric: {
    noCommonPoint: (seg1: string, seg2: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(ErrorMessages.GEOMETRIC.NO_COMMON_POINT(seg1, seg2)),
  },
  parser: {
    dependencyMismatch: (arg: string) =>
      shouldLog(LogLevel.DEBUG) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.DEPENDENCY_MISMATCH(arg)}`,
      ),
    missingReasonOrStatement: () =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.MISSING_REASON_OR_STATEMENT}`,
      ),
    undefinedStatement: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.UNDEFINED_STATEMENT(stmtFunction)}`,
      ),
    undefinedReason: (reasonFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.UNDEFINED_REASON(reasonFunction)}`,
      ),
    duplicateSteps: (step1: string, step2: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.DUPLICATE_STEPS(step1, step2)}`,
      ),
    nonSequentialStepNumbers: (expected: string, found: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.NON_SEQUENTIAL_STEP_NUMBERS(expected, found)}`,
      ),
    duplicateStepNumbers: (stepNumber: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.DUPLICATE_STEP_NUMBERS(stepNumber)}`,
      ),
    invalidAngleFormat: (angle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.INVALID_ANGLE_FORMAT(angle)}`,
      ),
    invalidTriangleFormat: (triangle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.INVALID_TRIANGLE_FORMAT(triangle)}`,
      ),
    invalidQuadrilateralFormat: (quadrilateral: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.INVALID_QUADRILATERAL_FORMAT(quadrilateral)}`,
      ),
    undefinedPointInObject: (point: string, object: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.UNDEFINED_POINT_IN_OBJECT(point, object)}`,
      ),
    duplicatePointsInObject: (object: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.DUPLICATE_POINTS_IN_OBJECT(object)}`,
      ),
    premisesOnlyStatementInProof: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.PREMISES_ONLY_STATEMENT_IN_PROOF(stmtFunction)}`,
      ),
    unknownStatementFunction: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.UNKNOWN_STATEMENT_FUNCTION(stmtFunction)}`,
      ),
    segmentAngleOverlapError: (segment: string, angle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.SEGMENT_ANGLE_OVERLAP_ERROR(segment, angle)}`,
      ),
    pointNotDefinedInPremises: (point: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.POINT_NOT_DEFINED_IN_PREMISES(point)}`,
      ),
  },
  proofChecker: {
    incorrectSteps: (count: number) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `\n${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.INCORRECT_STEPS(count)}`,
      ),
    proofHasIssues: () =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.PROOF_HAS_ISSUES}`,
      ),
    errorCheckingProof: (error: any) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.ERROR_CHECKING_PROOF(error.stack)}`,
      ),
  },
} as const;
