// Error constants for ender-proof-core
// This file centralizes all error messages to ensure consistency and maintainability

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export const LogLevelNames = {
  [LogLevel.DEBUG]: "debug",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
} as const;

export const ErrorMessages = {
  // Geometric object errors
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
    INCORRECT_GET_THIRD_POINT_ARGS: (
      triangleLabel: string,
      p1: string,
      p2: string
    ) =>
      `incorrect arguments passed to getThirdPoint for triangle ${triangleLabel}. Got: ${p1} ${p2}`,
    TRIANGLES_DO_NOT_CONTAIN_OBJECTS: (objects: string[], triangles: any[]) =>
      `sortPairToTri: triangles do not contain all characters of both objects`,
  },

  // Parser errors
  PARSER: {
    NO_DEFINITION_FOR_STATEMENT: (stmtFunction: string) =>
      `No definition found for statement: ${stmtFunction}`,
    NO_DEFINITION_FOR_REASON: (reasonFunction: string) =>
      `No definition found for reason: ${reasonFunction}`,
    DEPENDENCY_MISMATCH: (arg: string) => `Dependency mismatch for ${arg}`,
    MISSING_REASON_OR_STATEMENT: "Missing reason or statement",
    FAILED_TO_PARSE: "Failed to parse",
    UNDEFINED_STATEMENT: (stmtFunction: string) =>
      `Statement '${stmtFunction}' is not defined in stmts.txt`,
    UNDEFINED_REASON: (reasonFunction: string) =>
      `Reason '${reasonFunction}' is not defined in reasons.txt`,
    MISSING_POINT_IN_PREMISES: (point: string) =>
      `Point '${point}' is used in proof but not defined in premises`,
    DUPLICATE_STEPS: (step1: string, step2: string) =>
      `Duplicate steps found: Step ${step1} and Step ${step2} are identical`,
    NON_SEQUENTIAL_STEP_NUMBERS: (expected: string, found: string) =>
      `Non-sequential step numbers: expected Step ${expected}, found Step ${found}`,
    DUPLICATE_STEP_NUMBERS: (stepNumber: string) =>
      `Duplicate step number found: Step ${stepNumber} appears multiple times`,
    INVALID_SEGMENT_FORMAT: (segment: string) =>
      `Invalid segment format: '${segment}' - segments must have exactly 2 distinct points`,
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

  // Proof checker errors
  PROOF_CHECKER: {
    INCORRECT_STEPS: (count: number) => `Incorrect Steps: ${count}`,
    PROOF_HAS_ISSUES: "Proof has issues that need to be addressed.",
    ERROR_CHECKING_PROOF: (error: any) => `Error checking proof: ${error}`,
    MISSING_OBJECTS_FOR_SAS: "Missing objects for SAS test",
    ERROR_DEBUGGING_PROOF: (error: any) => `Error debugging proof: ${error}`,
  },

  // File and I/O errors
  FILE: {
    FILE_NOT_FOUND: (path: string) => `File not found: ${path}`,
    USAGE_PROOF_TO_LEAN:
      "Usage: ts-node lean/proofToLeanPremises.ts path/to/proof.txt",
  },

  // Debug and logging prefixes
  DEBUG: {
    ERROR_PREFIX: "❌",
    SUCCESS_PREFIX: "✅",
    WARNING_PREFIX: "⚠️",
  },
} as const;

// Global log level configuration
let currentLogLevel: LogLevel = LogLevel.WARN; // Default to warnings and errors

export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

export const getLogLevel = (): LogLevel => {
  return currentLogLevel;
};

// Helper function to check if a message should be logged
const shouldLog = (level: LogLevel): boolean => {
  return level >= currentLogLevel;
};

// Helper function for info-level logging
export const logInfo = (message: string): void => {
  shouldLog(LogLevel.INFO) && console.log(message);
};

// Helper function for debug-level logging
export const logDebug = (message: string): void => {
  shouldLog(LogLevel.DEBUG) && console.log(message);
};

// Helper functions for creating error objects
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
        ErrorMessages.PARSER.SEGMENT_ANGLE_OVERLAP_ERROR(segment, angle)
      ),
    pointNotDefinedInPremises: (point: string) =>
      new Error(ErrorMessages.PARSER.POINT_NOT_DEFINED_IN_PREMISES(point)),
  },
  file: {
    fileNotFound: (path: string) =>
      new Error(ErrorMessages.FILE.FILE_NOT_FOUND(path)),
  },
} as const;

// Console logging helpers
export const logError = {
  geometric: {
    noCommonPoint: (seg1: string, seg2: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(ErrorMessages.GEOMETRIC.NO_COMMON_POINT(seg1, seg2)),
    incorrectGetThirdPointArgs: (
      triangleLabel: string,
      p1: string,
      p2: string
    ) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(
        ErrorMessages.GEOMETRIC.INCORRECT_GET_THIRD_POINT_ARGS(
          triangleLabel,
          p1,
          p2
        )
      ),
    trianglesDoNotContainObjects: (objects: string[], triangles: any[]) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(
        ErrorMessages.GEOMETRIC.TRIANGLES_DO_NOT_CONTAIN_OBJECTS(
          objects,
          triangles.map((t) => t.label)
        )
      ),
  },
  parser: {
    noDefinitionForStatement: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.NO_DEFINITION_FOR_STATEMENT(stmtFunction)}`
      ),
    noDefinitionForReason: (reasonFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.NO_DEFINITION_FOR_REASON(reasonFunction)}`
      ),
    dependencyMismatch: (arg: string) =>
      shouldLog(LogLevel.DEBUG) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.DEPENDENCY_MISMATCH(arg)}`
      ),
    missingReasonOrStatement: () =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.MISSING_REASON_OR_STATEMENT}`
      ),
    failedToParse: () =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.FAILED_TO_PARSE}`
      ),
    undefinedStatement: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.UNDEFINED_STATEMENT(stmtFunction)}`
      ),
    undefinedReason: (reasonFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.UNDEFINED_REASON(reasonFunction)}`
      ),
    missingPointInPremises: (point: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.MISSING_POINT_IN_PREMISES(point)}`
      ),
    duplicateSteps: (step1: string, step2: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.DUPLICATE_STEPS(step1, step2)}`
      ),
    nonSequentialStepNumbers: (expected: string, found: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.NON_SEQUENTIAL_STEP_NUMBERS(expected, found)}`
      ),
    duplicateStepNumbers: (stepNumber: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.DUPLICATE_STEP_NUMBERS(stepNumber)}`
      ),
    invalidSegmentFormat: (segment: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.INVALID_SEGMENT_FORMAT(segment)}`
      ),
    invalidAngleFormat: (angle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.INVALID_ANGLE_FORMAT(angle)}`
      ),
    invalidTriangleFormat: (triangle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.INVALID_TRIANGLE_FORMAT(triangle)}`
      ),
    invalidQuadrilateralFormat: (quadrilateral: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.INVALID_QUADRILATERAL_FORMAT(quadrilateral)}`
      ),
    undefinedPointInObject: (point: string, object: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.UNDEFINED_POINT_IN_OBJECT(point, object)}`
      ),
    duplicatePointsInObject: (object: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.DUPLICATE_POINTS_IN_OBJECT(object)}`
      ),
    premisesOnlyStatementInProof: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.PREMISES_ONLY_STATEMENT_IN_PROOF(
          stmtFunction
        )}`
      ),
    unknownStatementFunction: (stmtFunction: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.UNKNOWN_STATEMENT_FUNCTION(stmtFunction)}`
      ),
    segmentAngleOverlapError: (segment: string, angle: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.SEGMENT_ANGLE_OVERLAP_ERROR(segment, angle)}`
      ),
    pointNotDefinedInPremises: (point: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.POINT_NOT_DEFINED_IN_PREMISES(point)}`
      ),
  },
  proofChecker: {
    incorrectSteps: (count: number) =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `\n${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.INCORRECT_STEPS(count)}`
      ),
    proofHasIssues: () =>
      shouldLog(LogLevel.ERROR) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.PROOF_HAS_ISSUES}`
      ),
    errorCheckingProof: (error: any) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.ERROR_CHECKING_PROOF(error.stack)}`
      ),
    missingObjectsForSAS: () =>
      shouldLog(LogLevel.DEBUG) &&
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.MISSING_OBJECTS_FOR_SAS}`
      ),
    errorDebuggingProof: (error: any) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.ERROR_DEBUGGING_PROOF(error.stack)}`
      ),
  },
  file: {
    fileNotFound: (path: string) =>
      shouldLog(LogLevel.ERROR) &&
      console.error(ErrorMessages.FILE.FILE_NOT_FOUND(path)),
    usageProofToLean: () =>
      shouldLog(LogLevel.ERROR) &&
      console.error(ErrorMessages.FILE.USAGE_PROOF_TO_LEAN),
  },
} as const;
