import { logError } from "../../errors/errorConstants";
import { ErrorObj } from "../../types/checkerTypes";

export const commonPt = (seg1: string, seg2: string): string => {
  for (const char of seg1) {
    if (seg2.includes(char)) {
      return char;
    }
  }
  logError.geometric.noCommonPoint(seg1, seg2);
  return "";
};

export const angCenter = (ang: string) => {
  return ang.replace("a_", "")[1];
};

export const stripAngPrefix = (angles: string[]) => {
  return angles.map((angle) => angle.replace("a_", ""));
};

export const stripTriPrefix = (triangles: string[]) => {
  return triangles.map((triangle) => triangle.replace("t_", ""));
};

export const addError = (errors: ErrorObj[], error: ErrorObj) => {
  if (!errors) {
    return [error];
  }
  return [...errors, error];
};

export const addReasonCheckError = (
  errors: ErrorObj[],
  details: Record<string, unknown>,
) => {
  return addError(errors, {
    type: "reason_check",
    data: details,
  });
};
