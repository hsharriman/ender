// Centralized error messages for thrown errors during premise building.

export const ErrorMessages = {
  GEOMETRIC: {
    ANGLE_NOT_FOUND: (arg: string) => `Angle ${arg} not found in context`,
    TRIANGLE_NOT_FOUND: (arg: string) => `Triangle ${arg} not found in context`,
    QUADRILATERAL_NOT_FOUND: (arg: string) =>
      `Quadrilateral ${arg} not found in context`,
    SEGMENT_NOT_FOUND: (arg: string) => `Segment ${arg} not found in context`,
    CIRCLE_NOT_FOUND: (arg: string) => `Circle ${arg} not found in context`,
    POINT_NOT_FOUND: (arg: string) => `Point ${arg} not found in context`,
    CANNOT_PARSE_GEOMETRIC_OBJECT: (arg: string) =>
      `Cannot parse geometric object from argument: ${arg}`,
    NO_COMMON_POINT: (seg1: string, seg2: string) =>
      `no common point found for ${seg1} and ${seg2}`,
  },

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
    circleNotFound: (arg: string) =>
      new Error(ErrorMessages.GEOMETRIC.CIRCLE_NOT_FOUND(arg)),
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
    premiseCounterpartRequired: (reason: string) =>
      new Error(ErrorMessages.PARSER.PREMISE_COUNTERPART_REQUIRED(reason)),
  },
} as const;
