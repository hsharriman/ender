/**
 * Insert a new proof step immediately after the step numbered `currentStepNum`,
 * renumber later `[NN]` headers, and bump numeric reason dependencies `D` where `D > currentStepNum`.
 *
 * By default the inserted line uses {@link NEW_PROOF_STEP_PLACEHOLDER_SOURCE} after `[NN]`;
 * the parser treats that token sequence as an empty proof step.
 */

import { NEW_PROOF_STEP_PLACEHOLDER_SOURCE } from "../../../checker/proofStepPlaceholder";

const STEP_LINE = /^\s*\[0*(\d+)\]/;
const BRACKET_PADDED_LINE = /^\s*\[([0-9]+)\]/;

const formatBracket = (n: number, pad: number): string =>
  `[${String(n).padStart(pad, "0")}]`;

const parseStepNumberFromLine = (line: string): number | null => {
  const m = line.match(STEP_LINE);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
};

const collectStepSection = (
  lines: string[],
): {
  stepsIdx: number;
  stepIndices: number[];
  maxNum: number;
  pad: number;
} => {
  const stepsIdx = lines.findIndex((l) => /^\s*steps:\s*$/i.test(l));
  if (stepsIdx < 0) {
    throw new Error("No steps: section found");
  }

  const stepIndices: number[] = [];
  let maxNum = 0;
  for (let i = stepsIdx + 1; i < lines.length; i++) {
    const n = parseStepNumberFromLine(lines[i]);
    if (n === null) continue;
    stepIndices.push(i);
    maxNum = Math.max(maxNum, n);
  }
  if (maxNum < 1) {
    throw new Error("No proof steps found under steps:");
  }
  return {
    stepsIdx,
    stepIndices,
    maxNum,
    pad: Math.max(detectPad(lines, stepIndices), 2),
  };
};

const findStepLineIndex = (
  lines: string[],
  stepIndices: number[],
  targetStepNum: number,
): number => {
  for (const i of stepIndices) {
    if (parseStepNumberFromLine(lines[i]) === targetStepNum) return i;
  }
  return -1;
};

const collectStepIndicesFrom = (lines: string[], startIdx: number): number[] => {
  const out: number[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (STEP_LINE.test(lines[i])) out.push(i);
  }
  return out;
};

const renumberRange = (
  lines: string[],
  stepIndices: number[],
  fromStart: number,
  fromEnd: number,
  delta: number,
  pad: number,
  descending: boolean,
): void => {
  if (descending) {
    for (let k = fromEnd; k >= fromStart; k--) {
      for (const i of stepIndices) {
        if (parseStepNumberFromLine(lines[i]) === k) {
          lines[i] = replaceLeadingBracket(lines[i], k, k + delta, pad);
          break;
        }
      }
    }
    return;
  }
  for (let k = fromStart; k <= fromEnd; k++) {
    for (const i of stepIndices) {
      if (parseStepNumberFromLine(lines[i]) === k) {
        lines[i] = replaceLeadingBracket(lines[i], k, k + delta, pad);
        break;
      }
    }
  }
};

const rewriteReasonSegment = (
  reason: string,
  transformRef: (ref: number) => number,
): string => {
  const m = reason.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]*)\)\s*$/);
  if (!m) return reason;
  const fn = m[1];
  const inner = m[2].trim();
  if (!inner) return reason;
  const parts = inner.split(",").map((s) => s.trim());
  const next = parts.map((p) => {
    if (/^\d+$/.test(p)) {
      const d = parseInt(p, 10);
      if (!Number.isNaN(d)) return String(transformRef(d));
    }
    return p;
  });
  return `${fn}(${next.join(", ")})`;
};

const rewriteStepLineDeps = (
  line: string,
  transformRef: (ref: number) => number,
): string => {
  const commentIdx = line.indexOf("//");
  const head = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const tail = commentIdx >= 0 ? line.slice(commentIdx) : "";
  const arrow = head.indexOf(" -> ");
  if (arrow < 0) return line;
  const rb = head.indexOf("]");
  if (rb < 0) return line;
  const reason = head.slice(rb + 1, arrow).trim();
  const rewritten = rewriteReasonSegment(reason, transformRef);
  return `${head.slice(0, rb + 1)} ${rewritten}${head.slice(arrow)}${tail}`;
};

const replaceLeadingBracket = (
  line: string,
  fromN: number,
  toN: number,
  pad: number,
): string => {
  const m = line.match(STEP_LINE);
  if (!m || parseInt(m[1], 10) !== fromN) return line;
  return line.replace(/^(\s*)\[[^\]]+\]/, (_, sp) => `${sp}${formatBracket(toN, pad)}`);
};

const detectPad = (lines: string[], stepIndices: number[]): number => {
  let pad = 2;
  for (const i of stepIndices) {
    const m = lines[i].match(BRACKET_PADDED_LINE);
    if (m) pad = Math.max(pad, m[1].length);
  }
  return pad;
};

/**
 * @param currentStepNum — numeric id of the active step (the new step becomes currentStepNum + 1).
 * @param newStepBody — optional `reason -> statement` text after the bracket; default is the harness placeholder comment (empty step for the checker).
 */
export const insertProofStepAfter = (
  proofText: string,
  currentStepNum: number,
  newStepBody = NEW_PROOF_STEP_PLACEHOLDER_SOURCE,
): string => {
  if (Number.isNaN(currentStepNum) || currentStepNum < 1) {
    throw new Error(`Invalid current step: ${currentStepNum}`);
  }

  const lines = proofText.split(/\r?\n/);
  const { stepIndices, maxNum, pad: basePad } = collectStepSection(lines);

  const insertAfter = findStepLineIndex(lines, stepIndices, currentStepNum);
  if (insertAfter < 0) {
    throw new Error(`Step [${currentStepNum}] not found`);
  }

  const pad = Math.max(basePad, String(maxNum + 1).length, 2);

  // 1) Bump numeric dependencies D > currentStepNum on every proof step line.
  for (const i of stepIndices) {
    lines[i] = rewriteStepLineDeps(lines[i], (d) =>
      d > currentStepNum ? d + 1 : d,
    );
  }

  // 2) Renumber headers from high to low so labels stay unique.
  renumberRange(
    lines,
    stepIndices,
    currentStepNum + 1,
    maxNum,
    1,
    pad,
    true,
  );

  // 3) Insert the new step line after the (unchanged) [currentStepNum] line.
  const indent = lines[insertAfter].match(/^(\s*)/)?.[1] ?? "";
  const bracket = `${indent}${formatBracket(currentStepNum + 1, pad)}`;
  const trimmedBody = newStepBody.trim();
  const newLine =
    trimmedBody === "" ? bracket : `${bracket} ${trimmedBody}`;

  lines.splice(insertAfter + 1, 0, newLine);

  return lines.join("\n");
};

/**
 * Delete proof step `[deletedStepNum]`, renumber later headers down by one,
 * and shift numeric reason dependencies `D > deletedStepNum` to `D - 1`.
 */
export const deleteProofStep = (
  proofText: string,
  deletedStepNum: number,
): string => {
  if (Number.isNaN(deletedStepNum) || deletedStepNum < 1) {
    throw new Error(`Invalid step number: ${deletedStepNum}`);
  }

  const lines = proofText.split(/\r?\n/);
  const { stepsIdx, stepIndices, maxNum, pad } = collectStepSection(lines);
  const deleteIdx = findStepLineIndex(lines, stepIndices, deletedStepNum);
  if (deleteIdx < 0) {
    throw new Error(`Step [${deletedStepNum}] not found`);
  }

  if (stepIndices.length <= 1) {
    throw new Error("Cannot delete the only proof step");
  }

  // Remove the step line first.
  lines.splice(deleteIdx, 1);

  // Recompute indices after splice.
  const nextStepIndices = collectStepIndicesFrom(lines, stepsIdx + 1);

  // Shift dependency refs down.
  for (const i of nextStepIndices) {
    lines[i] = rewriteStepLineDeps(lines[i], (d) =>
      d > deletedStepNum ? d - 1 : d,
    );
  }

  // Renumber [N] -> [N-1] for N > deletedStepNum.
  renumberRange(
    lines,
    nextStepIndices,
    deletedStepNum + 1,
    maxNum,
    -1,
    pad,
    false,
  );

  return lines.join("\n");
};
