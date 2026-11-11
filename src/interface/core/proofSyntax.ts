/**
 * Line tokenizer for syntax-highlighting proof text files in the editor.
 *
 * This is display-only: it never decides whether a proof is well formed, and
 * it must return every character of the line exactly once so the colored
 * overlay stays aligned with the textarea above it.
 */

export type ProofTokenKind =
  | "keyword" // title:, premises:, pt:, seg:, tri:, ang:, quad:, circ:, steps:
  | "point" // A, B, ... Z
  | "object" // t_ABC, a_ABC, q_ABCD, c_OA, AB
  | "stepId" // [01], [g_1], [d_01], and the step references inside a reason
  | "reason" // sas, given, cpctc, ...
  | "statement" // con_seg, con_tri, para, ...
  | "string"
  | "comment"
  | "plain";

export type ProofToken = { kind: ProofTokenKind; text: string };

// One alternative per token shape; the group that matched names the shape.
const TOKEN_RE =
  /("[^"]*"?)|(\/\/.*$)|(\[[^\]\n]*\]?)|(->)|([a-z][A-Za-z0-9_]*)(?=\s*\()|([a-z]+_[A-Za-z0-9_']+)|([A-Z][A-Za-z0-9']*)|(\d+)/g;

const HEADER_RE = /^(\s*)([a-z]+:)/;

function push(tokens: ProofToken[], kind: ProofTokenKind, text: string) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind) last.text += text;
  else tokens.push({ kind, text });
}

export function tokenizeProofLine(line: string): ProofToken[] {
  const tokens: ProofToken[] = [];
  let pos = 0;

  const header = HEADER_RE.exec(line);
  if (header) {
    push(tokens, "plain", header[1]);
    push(tokens, "keyword", header[2]);
    pos = header[0].length;
  }

  // Before "->" on a step line the function is the reason; otherwise (after
  // the arrow, a premise, or a goal) it is a statement.
  const isStep = /^\s*\[\d+\]/.test(line);
  let seenArrow = false;

  TOKEN_RE.lastIndex = pos;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    push(tokens, "plain", line.slice(pos, m.index));
    const inReason = isStep && !seenArrow;
    let kind: ProofTokenKind;
    if (m[1] !== undefined) kind = "string";
    else if (m[2] !== undefined) kind = "comment";
    else if (m[3] !== undefined) kind = "stepId";
    else if (m[4] !== undefined) {
      seenArrow = true;
      kind = "plain";
    } else if (m[5] !== undefined) kind = inReason ? "reason" : "statement";
    else if (m[6] !== undefined) kind = inReason ? "stepId" : "object";
    else if (m[7] !== undefined) kind = m[7].length === 1 ? "point" : "object";
    else kind = inReason ? "stepId" : "plain";
    push(tokens, kind, m[0]);
    pos = m.index + m[0].length;
  }
  push(tokens, "plain", line.slice(pos));
  return tokens;
}
