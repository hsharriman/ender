/**
 * Canonical suffix after `[NN] ` for a newly inserted harness step.
 * The lexer emits one `comment` token; the proof parser treats this as an empty proof step.
 */
export const NEW_PROOF_STEP_PLACEHOLDER_SOURCE =
  "// New proof step (click to edit)";

/** Hint shown in the harness row (without comment slashes). */
export const NEW_PROOF_STEP_PLACEHOLDER_HINT = "New proof step (click to edit)";

export const isNewProofStepPlaceholderSource = (body: string): boolean =>
  body.trim() === NEW_PROOF_STEP_PLACEHOLDER_SOURCE;
