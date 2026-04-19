/**
 * Insert a new proof step immediately after the step numbered `currentStepNum`,
 * renumber later `[NN]` headers, and bump numeric reason dependencies `D` where `D > currentStepNum`.
 *
 * By default the inserted line uses {@link NEW_PROOF_STEP_PLACEHOLDER_SOURCE} after `[NN]`;
 * the parser treats that token sequence as an empty proof step.
 */

import { NEW_PROOF_STEP_PLACEHOLDER_SOURCE } from "../../../checker/proofStepPlaceholder";

const STEP_LINE = /^\s*\[0*(\d+)\]/;

const formatBracket = (n: number, pad: number): string =>
  `[${String(n).padStart(pad, "0")}]`;

/** Bump only plain integer reason args (proof-step refs), e.g. sas(1, 2, 3). */
const bumpReasonSegment = (reason: string, currentStepNum: number): string => {
  const m = reason.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]*)\)\s*$/);
  if (!m) return reason;
  const fn = m[1];
  const inner = m[2].trim();
  if (!inner) return reason;
  const parts = inner.split(",").map((s) => s.trim());
  const next = parts.map((p) => {
    if (/^\d+$/.test(p)) {
      const d = parseInt(p, 10);
      if (!Number.isNaN(d) && d > currentStepNum) {
        return String(d + 1);
      }
    }
    return p;
  });
  return `${fn}(${next.join(", ")})`;
};

const bumpStepLineDeps = (line: string, currentStepNum: number): string => {
  const commentIdx = line.indexOf("//");
  const head = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const tail = commentIdx >= 0 ? line.slice(commentIdx) : "";
  const arrow = head.indexOf(" -> ");
  if (arrow < 0) return line;
  const rb = head.indexOf("]");
  if (rb < 0) return line;
  const reason = head.slice(rb + 1, arrow).trim();
  const bumped = bumpReasonSegment(reason, currentStepNum);
  return `${head.slice(0, rb + 1)} ${bumped}${head.slice(arrow)}${tail}`;
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
    const m = lines[i].match(/^\s*\[([0-9]+)\]/);
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
  const stepsIdx = lines.findIndex((l) => /^\s*steps:\s*$/i.test(l));
  if (stepsIdx < 0) {
    throw new Error("No steps: section found");
  }

  const stepIndices: number[] = [];
  let maxNum = 0;
  for (let i = stepsIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(STEP_LINE);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) {
      stepIndices.push(i);
      maxNum = Math.max(maxNum, n);
    }
  }

  if (maxNum < 1) {
    throw new Error("No proof steps found under steps:");
  }

  let insertAfter = -1;
  for (const i of stepIndices) {
    const m = lines[i].match(STEP_LINE);
    if (m && parseInt(m[1], 10) === currentStepNum) {
      insertAfter = i;
      break;
    }
  }
  if (insertAfter < 0) {
    throw new Error(`Step [${currentStepNum}] not found`);
  }

  const pad = Math.max(
    detectPad(lines, stepIndices),
    String(maxNum + 1).length,
    2,
  );

  // 1) Bump numeric dependencies D > currentStepNum on every proof step line.
  for (const i of stepIndices) {
    lines[i] = bumpStepLineDeps(lines[i], currentStepNum);
  }

  // 2) Renumber headers from high to low so labels stay unique.
  for (let k = maxNum; k >= currentStepNum + 1; k--) {
    for (const i of stepIndices) {
      const m = lines[i].match(STEP_LINE);
      if (m && parseInt(m[1], 10) === k) {
        lines[i] = replaceLeadingBracket(lines[i], k, k + 1, pad);
        break;
      }
    }
  }

  // 3) Insert the new step line after the (unchanged) [currentStepNum] line.
  const indent = lines[insertAfter].match(/^(\s*)/)?.[1] ?? "";
  const bracket = `${indent}${formatBracket(currentStepNum + 1, pad)}`;
  const trimmedBody = newStepBody.trim();
  const newLine =
    trimmedBody === "" ? bracket : `${bracket} ${trimmedBody}`;

  lines.splice(insertAfter + 1, 0, newLine);

  return lines.join("\n");
};
