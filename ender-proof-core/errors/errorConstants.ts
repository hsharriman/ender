// Error constants for ender-proof-core
// This file centralizes all error messages to ensure consistency and maintainability

export const ErrorMessages = {
  // Geometric object errors
  GEOMETRIC: {
    ANGLE_NOT_FOUND: (arg: string) => `Angle ${arg} not found in context`,
    TRIANGLE_NOT_FOUND: (arg: string) => `Triangle ${arg} not found in context`,
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

// Helper functions for creating error objects
export const createError = {
  geometric: {
    angleNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.ANGLE_NOT_FOUND(arg)),
    triangleNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.TRIANGLE_NOT_FOUND(arg)),
    segmentNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.SEGMENT_NOT_FOUND(arg)),
    pointNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.POINT_NOT_FOUND(arg)),
    cannotParseGeometricObject: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.CANNOT_PARSE_GEOMETRIC_OBJECT(arg)),
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
      console.error(ErrorMessages.GEOMETRIC.NO_COMMON_POINT(seg1, seg2)),
    incorrectGetThirdPointArgs: (
      triangleLabel: string,
      p1: string,
      p2: string
    ) =>
      console.error(
        ErrorMessages.GEOMETRIC.INCORRECT_GET_THIRD_POINT_ARGS(
          triangleLabel,
          p1,
          p2
        )
      ),
    trianglesDoNotContainObjects: (objects: string[], triangles: any[]) =>
      console.error(
        ErrorMessages.GEOMETRIC.TRIANGLES_DO_NOT_CONTAIN_OBJECTS(
          objects,
          triangles
        )
      ),
  },
  parser: {
    noDefinitionForStatement: (stmtFunction: string) =>
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.NO_DEFINITION_FOR_STATEMENT(stmtFunction)}`
      ),
    noDefinitionForReason: (reasonFunction: string) =>
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.NO_DEFINITION_FOR_REASON(reasonFunction)}`
      ),
    dependencyMismatch: (arg: string) =>
      console.log(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PARSER.DEPENDENCY_MISMATCH(arg)}`
      ),
    missingReasonOrStatement: () =>
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.MISSING_REASON_OR_STATEMENT}`
      ),
    failedToParse: () =>
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PARSER.FAILED_TO_PARSE}`
      ),
  },
  proofChecker: {
    incorrectSteps: (count: number) =>
      console.log(
        `\n${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.INCORRECT_STEPS(count)}`
      ),
    proofHasIssues: () =>
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.PROOF_HAS_ISSUES}`
      ),
    errorCheckingProof: (error: any) =>
      console.error(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.ERROR_CHECKING_PROOF(error)}`
      ),
    missingObjectsForSAS: () =>
      console.log(
        `${ErrorMessages.DEBUG.ERROR_PREFIX} ${ErrorMessages.PROOF_CHECKER.MISSING_OBJECTS_FOR_SAS}`
      ),
    errorDebuggingProof: (error: any) =>
      console.error(
        `${
          ErrorMessages.DEBUG.ERROR_PREFIX
        } ${ErrorMessages.PROOF_CHECKER.ERROR_DEBUGGING_PROOF(error)}`
      ),
  },
  file: {
    fileNotFound: (path: string) =>
      console.error(ErrorMessages.FILE.FILE_NOT_FOUND(path)),
    usageProofToLean: () =>
      console.error(ErrorMessages.FILE.USAGE_PROOF_TO_LEAN),
  },
} as const;
