/** One slot of a template: a cited step must match one of `statements`. */
export type TemplateSlot = {
  /** How a cited statement is compared, a name from `matcher_names`. */
  matcher: string;
  statements: string[];
};

/**
 * One way a reason can conclude a statement: the statements each cited step
 * must match, in citation order, and the diagram premises the template was
 * read from.  An argument the matcher ignores is written `*`.
 */
export type Template = { slots: TemplateSlot[]; premises: string[] };

/**
 * A proof the verified checker has parsed once, which can then check steps
 * that are not in the proof. Accepting or rejecting a proof never uses a
 * session. The answers come from the checker's own `rule_valid`,
 * `reason_needs`, and `matcher_accepts` (see "Proof sessions" in
 * `rocq/Ghost/CompleteChecker.v`).
 */
export type CheckerSession = {
  /**
   * Whether `reason -> conclusion`, written as step `position`, would be
   * accepted, citing only steps accepted before it.
   */
  accepts: (position: number, reason: string, conclusion: string) => boolean;
  /**
   * The templates `reason` would be checked against to conclude
   * `conclusion` as step `position`, or null when the reason has a rule of
   * its own.  The citation numbers in `reason` are not read.
   */
  needs: (
    position: number,
    reason: string,
    conclusion: string,
  ) => Template[] | null;
  /**
   * Whether a step that states `actual` matches the template statement
   * `expected` under `matcher` (`"loose"` is how most rules compare).
   */
  matches: (matcher: string, expected: string, actual: string) => boolean;
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
  ghostSessionNeeds?: (
    id: number,
    position: number,
    reason: string,
    conclusion: string,
  ) => string;
  ghostSessionMatches?: (
    id: number,
    matcher: string,
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
    needs: (position, reason, conclusion) =>
      JSON.parse(
        exports.ghostSessionNeeds!(id, position, reason, conclusion),
      ) as Template[] | null,
    matches: (matcher, expected, actual) =>
      exports.ghostSessionMatches!(id, matcher, expected, actual),
    close: () => exports.ghostCloseSession!(id),
  };
};
