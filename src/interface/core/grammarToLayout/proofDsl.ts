import { NEW_PROOF_STEP_PLACEHOLDER_SOURCE } from "../../../checker/proofStepPlaceholder";
import { Reason, Stmt } from "checker/types/checkerTypes";
import { Obj, ParseObj } from "geometry-object";

/** Serialize a parsed geometry object back to proof-text token form. */
export const parseObjToDsl = (o: ParseObj): string => {
  switch (o.type) {
    case Obj.Segment:
      return o.v;
    case Obj.Angle:
      return o.v.startsWith("a_") ? o.v : `a_${o.v}`;
    case Obj.Triangle:
      return o.v.startsWith("t_") ? o.v : `t_${o.v}`;
    case Obj.Quadrilateral:
      return o.v.startsWith("q_") ? o.v : `q_${o.v}`;
    case Obj.Point:
    default:
      return o.v;
  }
};

/** Serialize a statement to `function(arg1, arg2, ...)` proof form. */
export const stmtToDsl = (stmt: Stmt): string => {
  const args = stmt.arguments.map(parseObjToDsl).join(", ");
  return `${stmt.function}(${args})`;
};

/** Serialize a reason to `fn(a, b)` or `fn()` proof form. */
export const reasonToDsl = (reason: Reason): string => {
  if (reason.arguments.length === 0) {
    return `${reason.function}()`;
  }
  return `${reason.function}(${reason.arguments.join(", ")})`;
};

/**
 * Replace the single `steps:` line for the given numeric step id.
 * Preserves the original bracket token (e.g. `[01]` vs `[1]`).
 */
export const replaceProofStepLine = (
  proofText: string,
  stepNumber: string,
  reasonDsl: string,
  statementDsl: string,
): string => {
  const want = parseInt(stepNumber, 10);
  if (Number.isNaN(want)) {
    throw new Error(`Invalid step number: ${stepNumber}`);
  }
  const lines = proofText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^\s*\[0*(\d+)\]/);
    if (!m) continue;
    if (parseInt(m[1], 10) !== want) continue;
    const indent = line.match(/^(\s*)/)?.[1] ?? "";
    const bracket = line.match(/^\s*(\[[^\]]+\])/)?.[1] ?? `[${want}]`;
    const r = reasonDsl.trim();
    const s = statementDsl.trim();
    lines[i] =
      r === "" && s === ""
        ? `${indent}${bracket} ${NEW_PROOF_STEP_PLACEHOLDER_SOURCE}`
        : `${indent}${bracket} ${reasonDsl} -> ${statementDsl}`;
    return lines.join("\n");
  }
  throw new Error(`No proof step line found for step [${stepNumber}]`);
};

/** Text after `[NN]` on the matching `steps:` line, or `null` if not found. */
export const extractProofStepLineBodyAfterBracket = (
  proofText: string,
  stepNumber: string,
): string | null => {
  const want = parseInt(stepNumber, 10);
  if (Number.isNaN(want)) return null;
  const lines = proofText.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*\[0*(\d+)\]\s*(.*)$/);
    if (!m) continue;
    if (parseInt(m[1], 10) !== want) continue;
    return m[2];
  }
  return null;
};
