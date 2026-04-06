export type TriangleReasonFailure = {
  code: string;
  details?: Record<string, unknown>;
};

export type TriangleReasonResult =
  | { ok: true }
  | { ok: false; failure: TriangleReasonFailure };

export const triangleOk = (): TriangleReasonResult => {
  return { ok: true };
};

export const triangleFail = (
  code: string,
  details?: Record<string, unknown>,
): TriangleReasonResult  => {
  return { ok: false, failure: { code, details } };
};
