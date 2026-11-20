/**
 * A proof the verified checker has parsed once, which can then check steps
 * that are not in the proof. Accepting or rejecting a proof never uses a
 * session. The answers come from the checker's own `rule_valid` and
 * `dependency_matches` (see "Proof sessions" in
 * `rocq/Ghost/CompleteChecker.v`).
 */
export type CheckerSession = {
  /**
   * Whether `reason -> conclusion`, written as step `position`, would be
   * accepted, citing only steps accepted before it.
   */
  accepts: (position: number, reason: string, conclusion: string) => boolean;
  /**
   * Whether a step that states `actual` can be cited where `expected` is
   * needed.
   */
  satisfies: (expected: string, actual: string) => boolean;
  /** Free the parsed proof. */
  close: () => void;
};

export type SessionExports = {
  ghostOpenSession?: (source: string) => number;
  ghostSessionAccepts?: (
    id: number,
    position: number,
    reason: string,
    conclusion: string,
  ) => boolean;
  ghostSessionSatisfies?: (
    id: number,
    expected: string,
    actual: string,
  ) => boolean;
  ghostCloseSession?: (id: number) => void;
};

/** Open a session through the Wasm exports, or null if the source does not parse. */
export const openSessionWith = (
  exports: SessionExports,
  source: string,
): CheckerSession | null => {
  const id = exports.ghostOpenSession!(source);
  if (id < 0) return null;
  return {
    accepts: (position, reason, conclusion) =>
      exports.ghostSessionAccepts!(id, position, reason, conclusion),
    satisfies: (expected, actual) =>
      exports.ghostSessionSatisfies!(id, expected, actual),
    close: () => exports.ghostCloseSession!(id),
  };
};
