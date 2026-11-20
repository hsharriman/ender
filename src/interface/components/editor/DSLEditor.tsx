import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  prevSnippetField,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  EditorState,
  Prec,
  RangeSet,
  RangeSetBuilder,
  StateEffect,
  StateField,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  drawSelection,
  EditorView,
  gutter,
  GutterMarker,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { proofLanguageSupport, proofTab } from "./dslLanguage";

/** Checker feedback for one line of the text, by line index. */
export type DSLEditorLine = {
  /** The line's text when it was checked; a line edited since is skipped. */
  text?: string;
  status?: "accepted" | "rejected" | "blocked" | "incomplete";
  /** Shown when hovering the line's status dot. */
  tooltip?: string;
  /** Character ranges within the line to underline in red. */
  squiggles?: Array<{ start: number; end: number }>;
};

export type DSLEditorProps = {
  value: string;
  onChange: (text: string) => void;
  /** Feedback to draw on the text, one entry per line. */
  lines?: DSLEditorLine[];
  /** Size of the editor box; defaults to filling its container. */
  size?: { width?: CSSProperties["width"]; height?: CSSProperties["height"] };
  className?: string;
};

type Tooltip = { text: string; x: number; y: number };

const setLines = StateEffect.define<DSLEditorLine[]>();

const LINE_CLASS: Record<string, string> = {
  rejected: "cm-line-rejected",
  blocked: "cm-line-blocked",
  incomplete: "cm-line-incomplete",
};

const squiggleMark = Decoration.mark({ class: "cm-squiggle" });

/** Each line's feedback, where the line still reads as it did when checked. */
const matchingLines = (state: EditorState, lines: DSLEditorLine[]) =>
  lines.flatMap((feedback, idx) => {
    if (idx >= state.doc.lines) return [];
    const line = state.doc.line(idx + 1);
    if (feedback.text !== undefined && feedback.text !== line.text) return [];
    return [{ feedback, line }];
  });

const buildDecorations = (
  state: EditorState,
  lines: DSLEditorLine[],
): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  matchingLines(state, lines).forEach(({ feedback, line }) => {
    const lineClass = feedback.status && LINE_CLASS[feedback.status];
    if (lineClass) {
      builder.add(line.from, line.from, Decoration.line({ class: lineClass }));
    }
    [...(feedback.squiggles ?? [])]
      .sort((a, b) => a.start - b.start)
      .forEach(({ start, end }) => {
        const from = line.from + Math.max(0, start);
        const to = Math.min(line.to, line.from + end);
        if (to > from) builder.add(from, to, squiggleMark);
      });
  });
  return builder.finish();
};

const lineDecorations = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (decorations, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(setLines)) return buildDecorations(tr.state, effect.value);
    }
    return decorations.map(tr.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

class StatusDot extends GutterMarker {
  constructor(
    readonly status: string,
    readonly tooltip: string,
    readonly onHover: (dot: HTMLElement | null, text: string) => void,
  ) {
    super();
  }

  eq = (other: GutterMarker): boolean =>
    other instanceof StatusDot &&
    other.status === this.status &&
    other.tooltip === this.tooltip;

  toDOM = (): Node => {
    const dot = document.createElement("span");
    dot.className = `cm-status-dot cm-status-dot-${this.status}`;
    dot.setAttribute("aria-label", this.tooltip);
    dot.addEventListener("mouseenter", () => this.onHover(dot, this.tooltip));
    dot.addEventListener("mouseleave", () => this.onHover(null, ""));
    return dot;
  };
}

const statusGutter = (
  onHover: (dot: HTMLElement | null, text: string) => void,
) => {
  const markers = StateField.define<RangeSet<GutterMarker>>({
    create: () => RangeSet.empty,
    update: (set, tr) => {
      for (const effect of tr.effects) {
        if (!effect.is(setLines)) continue;
        const builder = new RangeSetBuilder<GutterMarker>();
        matchingLines(tr.state, effect.value).forEach(({ feedback, line }) => {
          if (feedback.status && feedback.tooltip) {
            builder.add(
              line.from,
              line.from,
              new StatusDot(feedback.status, feedback.tooltip, onHover),
            );
          }
        });
        return builder.finish();
      }
      return set.map(tr.changes);
    },
  });
  return [
    markers,
    gutter({
      class: "cm-status-gutter",
      markers: (view) => view.state.field(markers),
    }),
  ];
};

const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "12px",
      backgroundColor: "#ffffff",
      color: "#000000",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      lineHeight: "1.5",
      overflow: "auto",
    },
    ".cm-content": { caretColor: "#000000", padding: "6px 0" },
    ".cm-activeLine": { backgroundColor: "#f8fafc" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "#bfdbfe !important",
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      border: "none",
    },
    ".cm-status-gutter": { width: "12px" },
    ".cm-status-gutter .cm-gutterElement": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    ".cm-status-dot": {
      display: "inline-block",
      width: "8px",
      height: "8px",
      borderRadius: "9999px",
      cursor: "help",
    },
    ".cm-status-dot-rejected": { backgroundColor: "#dc2626" },
    ".cm-status-dot-blocked": { backgroundColor: "#fbbf24" },
    ".cm-status-dot-incomplete": { backgroundColor: "#94a3b8" },
    ".cm-line-rejected": { backgroundColor: "#fee2e2" },
    ".cm-line-blocked": { backgroundColor: "#fffbeb" },
    ".cm-line-incomplete": { backgroundColor: "#f1f5f9" },
    ".cm-squiggle": {
      textDecoration: "underline wavy #dc2626",
      textUnderlineOffset: "3px",
    },
    ".cm-tooltip-autocomplete": { fontSize: "12px" },
    ".cm-completionDetail": {
      marginLeft: "1em",
      fontStyle: "normal",
      color: "#6b7280",
    },
  },
  { dark: false },
);

/**
 * A CodeMirror editor for proof files, with the DSL's syntax highlighting,
 * Tab completion of reasons, statements, and new steps, and checker feedback
 * drawn on the text.
 */
export const DSLEditor = ({
  value,
  onChange,
  lines = [],
  size,
  className,
}: DSLEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const onHover = (dot: HTMLElement | null, text: string) => {
      const container = containerRef.current;
      if (!dot || !container) {
        setTooltip(null);
        return;
      }
      const box = container.getBoundingClientRect();
      const at = dot.getBoundingClientRect();
      setTooltip({
        text,
        x: at.right - box.left + 6,
        y: Math.max(4, at.top - box.top - 6),
      });
    };
    const view = new EditorView({
      parent: hostRef.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          highlightActiveLine(),
          closeBrackets(),
          EditorView.lineWrapping,
          EditorState.tabSize.of(2),
          proofLanguageSupport(),
          autocompletion({ defaultKeymap: true, icons: false }),
          Prec.highest(
            keymap.of([{ key: "Tab", run: proofTab, shift: prevSnippetField }]),
          ),
          keymap.of([
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...historyKeymap,
            ...defaultKeymap,
          ]),
          lineDecorations,
          statusGutter(onHover),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            scroll: () => setTooltip(null),
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The view is created once; later values arrive through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Take a value set from outside, such as a newly loaded proof.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: setLines.of(lines) });
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border border-slate-200 rounded bg-white ${className ?? ""}`}
      style={{ width: size?.width ?? "100%", height: size?.height ?? "100%" }}
    >
      <div ref={hostRef} className="h-full" />
      {tooltip && (
        <div
          className="absolute z-20 max-w-[420px] rounded border border-slate-300 bg-white/95 px-2 py-1 text-[11px] leading-4 text-slate-900 shadow pointer-events-none whitespace-pre-wrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
