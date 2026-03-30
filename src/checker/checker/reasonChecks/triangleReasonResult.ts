export type TriangleReasonFailure = {
  code: string;
  details?: Record<string, unknown>;
};

export type TriangleReasonResult =
  | { ok: true }
  | { ok: false; failure: TriangleReasonFailure };

export function triangleOk(): TriangleReasonResult {
  return { ok: true };
}

export function triangleFail(
  code: string,
  details?: Record<string, unknown>,
): TriangleReasonResult {
  return { ok: false, failure: { code, details } };
}
