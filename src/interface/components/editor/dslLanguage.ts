import {
  acceptCompletion,
  Completion,
  CompletionContext,
  CompletionResult,
  nextSnippetField,
  snippetCompletion,
  startCompletion,
} from "@codemirror/autocomplete";
import {
  HighlightStyle,
  StreamLanguage,
  StringStream,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { reasonDef, ReasonDef, REASONS } from "checker/grammar/catalog";
import { STEP_NUMBER } from "checker/grammar/syntax";
import { STMTS_DEFS } from "checker/grammar/defs/stmts.defs";

/*
 * Syntax highlighting, completion, and Tab behavior for proof files.
 * The colors match the DSL listings in the PLDI '27 paper (VS Code Light+).
 */

type Section = "header" | "premises" | "steps";

type TokenState = {
  section: Section;
  /** Whether this line has passed its `->`. */
  afterArrow: boolean;
};

const SECTION_KEYWORDS = ["title:", "premises:", "steps:"];
const DECLARATION_KEYWORDS = [
  "pt:",
  "seg:",
  "ang:",
  "tri:",
  "quad:",
  "circ:",
  "arc:",
];

/** Points (`A`), segments (`AB`), and named objects (`a_ABC`, `t_ABC`). */
const OBJECT_NAME = /^(?:[A-Z]+|[a-z]_[A-Z]+)$/;

const proofLanguage = StreamLanguage.define<TokenState>({
  name: "ghost-proof",
  startState: () => ({ section: "header", afterArrow: false }),
  copyState: (state) => ({ ...state }),
  token: (stream: StringStream, state: TokenState): string | null => {
    if (stream.sol()) state.afterArrow = false;
    if (stream.eatSpace()) return null;
    if (stream.match("//") || stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^"[^"]*"?/)) return "string";
    const keyword = stream.match(/^[a-z]+:/);
    if (keyword) {
      const word = (keyword as RegExpMatchArray)[0];
      if (word === "premises:") state.section = "premises";
      if (word === "steps:") state.section = "steps";
      return "keyword";
    }
    if (stream.match("->")) {
      state.afterArrow = true;
      return null;
    }
    if (stream.match(/^\[[^\]]*\]/)) return null;
    // A name followed by `(` is a reason before a step's `->`, and a
    // statement everywhere else.
    if (stream.match(/^[A-Za-z_]\w*(?=\s*\()/)) {
      return state.section === "steps" && !state.afterArrow
        ? "reason"
        : "statement";
    }
    const word = stream.match(/^[A-Za-z_]\w*/);
    if (word) {
      return OBJECT_NAME.test((word as RegExpMatchArray)[0]) ? "object" : null;
    }
    stream.next();
    return null;
  },
  tokenTable: {
    reason: tags.function(tags.variableName),
    statement: tags.typeName,
    object: tags.variableName,
  },
});

const proofHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#0000FF" },
  { tag: tags.variableName, color: "#AF00DB" },
  { tag: tags.function(tags.variableName), color: "#00804F" },
  { tag: tags.typeName, color: "#A31515" },
  { tag: tags.string, color: "#6B7280" },
  { tag: tags.comment, color: "#6B7280", fontStyle: "italic" },
]);

// ---------------------------------------------------------------------------
// Completion

type StatementDef = {
  name: string;
  parameters: readonly string[];
  isPremisesOnly?: boolean;
  isDiagramOnly?: boolean;
};

const statementDefs = Object.values(
  STMTS_DEFS.statements,
) as readonly StatementDef[];
const groupBase: Record<string, string> = Object.fromEntries(
  Object.values(STMTS_DEFS.groups).map((g) => [g.name, g.base]),
);

/** "Segment s1" -> "s1"; "Points (at least 3)" -> "points". */
const parameterName = (parameter: string): string => {
  const word = parameter.split(" ").pop() ?? "x";
  return /^[a-z]\w*$/.test(word) ? word : "points";
};

/** Escape text for a snippet template, where `$`, `{`, and `}` are special. */
const snippetText = (text: string): string => text.replace(/[${}\\]/g, "\\$&");

const statementCompletion = (def: StatementDef, boost = 0): Completion =>
  snippetCompletion(
    `${def.name}(${def.parameters
      .map((p, i) => `\${${i + 1}:${snippetText(parameterName(p))}}`)
      .join(", ")})\${}`,
    {
      label: def.name,
      type: "type",
      detail: def.parameters.join(", "),
      boost,
    },
  );

/** The statement a dependency slot needs, for a placeholder: `con_seg`. */
const dependencyPlaceholder = (dependency: string): string =>
  dependency === "__given_premise__"
    ? "g_1"
    : (groupBase[dependency] ?? dependency);

const reasonCompletion = (def: ReasonDef): Completion =>
  snippetCompletion(
    `${def.name}(${def.dependencies
      .map((d, i) => `\${${i + 1}:${snippetText(dependencyPlaceholder(d))}}`)
      .join(", ")}) -> \${}`,
    {
      label: def.name,
      type: "function",
      detail: def.title,
    },
  );

const reasonCompletions = REASONS.map(reasonCompletion);
const diagramStatementCompletions = statementDefs
  .filter((def) => def.isPremisesOnly)
  .map((def) => statementCompletion(def));
const allStatementCompletions = statementDefs.map((def) =>
  statementCompletion(def),
);

const keywordCompletions = (section: Section): Completion[] =>
  (section === "premises"
    ? [...DECLARATION_KEYWORDS, "steps:"]
    : SECTION_KEYWORDS
  ).map((label) => ({ label, type: "keyword", apply: `${label} ` }));

/** The section the line containing `pos` is in. */
const sectionAt = (state: EditorState, pos: number): Section => {
  const before = state.doc.sliceString(0, state.doc.lineAt(pos).from);
  if (/^\s*steps:/m.test(before)) return "steps";
  if (/^\s*premises:/m.test(before)) return "premises";
  return "header";
};

type CompletionSlot =
  | { kind: "reason" }
  | { kind: "statement"; reason?: string }
  | { kind: "diagram" }
  | { kind: "keyword"; section: Section };

/** What belongs at the cursor, judged from the text before it on its line. */
const slotAt = (state: EditorState, pos: number): CompletionSlot | null => {
  const line = state.doc.lineAt(pos);
  const before = state.doc.sliceString(line.from, pos);
  const section = sectionAt(state, pos);
  if (/^\s*[a-z]*$/.test(before) && section !== "steps") {
    return { kind: "keyword", section };
  }
  if (section === "steps") {
    if (/^\s*\[[^\]]*\]\s*\w*$/.test(before)) return { kind: "reason" };
    const afterArrow = before.match(/^\s*\[[^\]]*\]\s*(\w+)?.*->\s*\w*$/);
    if (afterArrow) return { kind: "statement", reason: afterArrow[1] };
    return null;
  }
  if (section === "premises") {
    if (/^\s*\[d_\w*\]\s*\w*$/.test(before)) return { kind: "diagram" };
    if (/^\s*\[\w*\]\s*\w*$/.test(before) || /->\s*\w*$/.test(before)) {
      return { kind: "statement" };
    }
  }
  return null;
};

const completeProof = (context: CompletionContext): CompletionResult | null => {
  const slot = slotAt(context.state, context.pos);
  if (!slot) return null;
  const word = context.matchBefore(/[a-z_:]*/);
  const from = word ? word.from : context.pos;
  if (!context.explicit && (!word || word.from === word.to)) return null;
  const validFor = /^[a-z_:]*$/;
  switch (slot.kind) {
    case "keyword":
      return { from, options: keywordCompletions(slot.section), validFor };
    case "reason":
      return { from, options: reasonCompletions, validFor };
    case "diagram":
      return { from, options: diagramStatementCompletions, validFor };
    case "statement": {
      const conclusions =
        (slot.reason && reasonDef(slot.reason)?.conclusions) || [];
      const options = slot.reason
        ? statementDefs
            .filter((def) => !def.isPremisesOnly)
            .map((def) =>
              statementCompletion(def, conclusions.includes(def.name) ? 50 : 0),
            )
        : allStatementCompletions;
      return { from, options, validFor };
    }
  }
};

// ---------------------------------------------------------------------------
// Tab

/** One more than the largest step number at or above `lineNumber`. */
const nextStepNumber = (state: EditorState, lineNumber: number): number => {
  let largest = 0;
  for (let n = 1; n <= lineNumber; n++) {
    const match = state.doc.line(n).text.match(STEP_NUMBER);
    if (match) largest = Math.max(largest, Number(match[1]));
  }
  return largest + 1;
};

/**
 * Start a new step: on a blank line in the steps section, write its number;
 * at the end of a written step, open a numbered line below it.
 */
const insertStep = (view: EditorView): boolean => {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty || sectionAt(state, range.head) !== "steps") return false;
  const line = state.doc.lineAt(range.head);
  if (range.head !== line.to) return false;
  const blank = line.text.trim() === "";
  if (!blank && !STEP_NUMBER.test(line.text)) return false;
  const label = `[${String(nextStepNumber(state, line.number)).padStart(2, "0")}] `;
  const insert = blank ? label : `\n${label}`;
  view.dispatch({
    changes: { from: blank ? line.from : line.to, to: line.to, insert },
    selection: { anchor: (blank ? line.from : line.to) + insert.length },
    scrollIntoView: true,
  });
  startCompletion(view);
  return true;
};

/** Open the completion list when the cursor sits where a name belongs. */
const completeHere = (view: EditorView): boolean => {
  const { state } = view;
  const range = state.selection.main;
  if (!range.empty) return false;
  const slot = slotAt(state, range.head);
  if (!slot || slot.kind === "keyword") return false;
  // A step that already names its conclusion is finished; Tab starts a new one.
  const line = state.doc.lineAt(range.head);
  if (/\)\s*$/.test(state.doc.sliceString(line.from, range.head))) {
    return false;
  }
  return startCompletion(view);
};

/**
 * Tab, in order: accept the highlighted completion, move to the snippet's
 * next field, suggest a reason or statement, or start a new step.
 */
export const proofTab = (view: EditorView): boolean =>
  acceptCompletion(view) ||
  nextField(view) ||
  completeHere(view) ||
  insertStep(view);

/** Move to the snippet's next field, and list statements on reaching `->`. */
const nextField = (view: EditorView): boolean => {
  if (!nextSnippetField(view)) return false;
  const head = view.state.selection.main.head;
  if (slotAt(view.state, head)?.kind === "statement") completeHere(view);
  return true;
};

export const proofLanguageSupport = (): Extension => [
  proofLanguage,
  syntaxHighlighting(proofHighlightStyle),
  proofLanguage.data.of({ autocomplete: completeProof }),
];
