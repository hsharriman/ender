export type ReasonApplicationFailure = {
  code: string;
  details?: Record<string, unknown>;
};

export type ReasonApplicationResult =
  | { ok: true }
  | { ok: false; failure: ReasonApplicationFailure };

export const reasonApplicationOk = (): ReasonApplicationResult => {
  return { ok: true };
};

export const reasonApplicationFail = (
  code: string,
  details?: Record<string, unknown>,
): ReasonApplicationResult => {
  return { ok: false, failure: { code, details } };
};
