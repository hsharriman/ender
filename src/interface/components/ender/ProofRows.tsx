import React from "react";
import { ProofTextItem } from "../../core/types/stepTypes";
import { ReasonPickerPopover } from "./ReasonPickerPopover";

/** Inline proof editing in ProofObjHarness: DSL strings + commit to shared proof text. */
export interface HarnessInlineEditConfig {
  reasonNames: string[];
  stepByKey: Map<
    string,
    {
      stepNumber: string;
      statementDsl: string;
      reasonDsl: string;
      harnessEmptyStepHint?: string;
    }
  >;
  onCommit: (
    stepNumber: string,
    statementDsl: string,
    reasonDsl: string,
  ) => void;
}

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
  isCompact: boolean;
  reliesOn?: Map<string, Set<string>>;
  isTutorial?: boolean;
  /** When true, every proof step row is expanded (harness / dev tooling). */
  revealAll?: boolean;
  harnessInlineEdit?: HarnessInlineEditConfig;
  /** ProofObjHarness: insert a new step after the active proof step (by checker step number). */
  insertProofStepAfter?: (afterStepNumber: string) => void;
}
export interface ProofRowsState {
  idx: number;
  revealed: number;
  harnessEditState: null | {
    stepKey: string;
    field: "statement" | "reason";
    statementDraft: string;
    reasonDraft: string;
  };
}
export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";
  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      idx: 0,
      revealed: 0,
      harnessEditState: null,
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyboardPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyboardPress);
  }

  private maxRevealIdx(): number {
    return Math.max(0, this.props.items.length - 2);
  }

  private effectiveRevealed(): number {
    if (this.props.revealAll) {
      return this.maxRevealIdx();
    }
    return this.state.revealed;
  }

  componentDidUpdate(prevProps: ProofRowsProps) {
    if (prevProps.items.length !== this.props.items.length) {
      const maxIdx = this.props.items.length - 1;
      if (this.state.idx > maxIdx) {
        const k = this.props.items[maxIdx]?.k;
        this.setState({
          idx: maxIdx,
          revealed: this.maxRevealIdx(),
          harnessEditState: null,
        });
        if (k) this.props.onClick(k);
      }
    }
    if (
      prevProps.harnessInlineEdit !== this.props.harnessInlineEdit &&
      this.state.harnessEditState
    ) {
      this.setState({ harnessEditState: null });
    }
  }

  onReveal = () => {
    if (this.state.revealed < this.props.items.length - 2) {
      const newIdx = this.state.revealed + 1;
      this.setState({ revealed: newIdx, idx: newIdx + 1 });
      const newId = `s${newIdx}`;
      this.props.onClick(newId);
    }
  };

  onKeyboardPress = (event: KeyboardEvent) => {
    let newIdx = this.state.idx;
    const rev = this.effectiveRevealed();
    let reveal = this.state.idx > 0 && rev < this.props.items.length - 2;
    if (
      event.key === "ArrowDown" &&
      this.state.idx < this.props.items.length - 1
    ) {
      newIdx = this.state.idx + 1;
      reveal = this.state.idx > rev; // false if active idx is not beyond what has been revealed
    } else if (event.key === "ArrowUp" && this.state.idx > 0) {
      newIdx = this.state.idx - 1;
      reveal = false; // don't reveal on Up arrow press
    }
    if (newIdx !== this.state.idx && this.props.items[newIdx] !== undefined) {
      const newActive = this.props.items[newIdx].k;
      this.setState({
        idx: newIdx,
        revealed: reveal ? this.state.revealed + 1 : this.state.revealed,
      });
      this.props.onClick(newActive);
    }
  };

  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const active = event.currentTarget.id.replace(this.idPrefix, "");
    if (active !== this.props.active) {
      const newIdx = this.props.items.findIndex((item) => item.k === active);
      if (newIdx === -1) {
        console.error(
          "couldn't find match in ProofRows items array for key: ",
          active,
        );
      }
      this.setState({
        idx: newIdx,
        revealed:
          newIdx - 1 > this.state.revealed ? newIdx - 1 : this.state.revealed,
      });
      this.props.onClick(active);
    }
  };

  selectRowKey = (itemKey: string) => {
    if (this.props.active === itemKey) return;
    const newIdx = this.props.items.findIndex((item) => item.k === itemKey);
    if (newIdx === -1) return;
    this.setState({
      idx: newIdx,
      revealed:
        newIdx - 1 > this.state.revealed ? newIdx - 1 : this.state.revealed,
    });
    this.props.onClick(itemKey);
  };

  beginHarnessEdit = (stepKey: string, field: "statement" | "reason") => {
    const hi = this.props.harnessInlineEdit;
    if (!hi) return;
    const meta = hi.stepByKey.get(stepKey);
    if (!meta) return;
    this.setState((prev) => {
      const cur = prev.harnessEditState;
      if (cur?.stepKey === stepKey) {
        return {
          harnessEditState: {
            ...cur,
            field,
          },
        };
      }
      return {
        harnessEditState: {
          stepKey,
          field,
          statementDraft: meta.statementDsl,
          reasonDraft: meta.reasonDsl,
        },
      };
    });
  };

  commitHarnessEdit = () => {
    const hi = this.props.harnessInlineEdit;
    const st = this.state.harnessEditState;
    if (!hi || !st) return;
    const meta = hi.stepByKey.get(st.stepKey);
    if (!meta) return;
    hi.onCommit(
      meta.stepNumber,
      st.statementDraft.trim(),
      st.reasonDraft.trim(),
    );
    this.setState({ harnessEditState: null });
  };

  cancelHarnessEdit = () => {
    this.setState({ harnessEditState: null });
  };

  updateHarnessDraft = (
    patch: Partial<{
      statementDraft: string;
      reasonDraft: string;
      field: "statement" | "reason";
    }>,
  ) => {
    this.setState((prev) => ({
      harnessEditState:
        prev.harnessEditState === null
          ? null
          : { ...prev.harnessEditState, ...patch },
    }));
  };

  renderPremise = (premise: string, item: ProofTextItem) => {
    return (
      <div className="flex flex-row justify-start">
        {highlightBar(this.props.active === item.k, "h-12")}
        <button
          id={`${this.idPrefix}${item.k}`}
          onClick={this.onClick}
          className="py-2 border-b-2 border-gray-300 text-md w-full h-12 ml-2 focus:outline-none"
        >
          <div className="flex flex-row justify-start gap-8 align-baseline items-baseline ml-2 border-slate-800">
            <div className="font-semibold ">{`${premise}:`} </div>
            {item.v(this.props.active === item.k)}
          </div>
        </button>
      </div>
    );
  };

  renderRow = (item: ProofTextItem, i: number) => {
    const activeItem = this.props.items[this.state.idx];
    const isActive = activeItem && item.k === activeItem.k;
    // if the active row is given or prove, focus all the proof rows
    const depends = (activeItem && activeItem.dependsOn?.has(item.k)) || false;
    const hi = this.props.harnessInlineEdit;
    const meta = hi?.stepByKey.get(item.k);
    const hEdit = this.state.harnessEditState;
    const harnessInline =
      hi && meta
        ? {
            ...meta,
            reasonNames: hi.reasonNames,
            editing:
              hEdit?.stepKey === item.k
                ? {
                    field: hEdit.field,
                    statementDraft: hEdit.statementDraft,
                    reasonDraft: hEdit.reasonDraft,
                  }
                : null,
            onBeginEdit: this.beginHarnessEdit,
            onDraftChange: this.updateHarnessDraft,
            onCommitEdit: this.commitHarnessEdit,
            onCancelEdit: this.cancelHarnessEdit,
            onSelectRow: this.selectRowKey,
          }
        : undefined;

    const insertFn = this.props.insertProofStepAfter;
    const stepNumForInsert = meta?.stepNumber;
    const showInsertButton = Boolean(
      insertFn &&
      stepNumForInsert !== undefined &&
      isActive &&
      item.k.startsWith("s"),
    );

    const harnessInsertAfter = showInsertButton
      ? () => {
          if (insertFn && stepNumForInsert !== undefined) {
            insertFn(stepNumForInsert);
          }
        }
      : undefined;

    return (
      <ProofRow
        key={item.k}
        isActive={isActive}
        depends={depends}
        onClick={this.onClick}
        isTutorial={this.props.isTutorial || false}
        revealed={this.effectiveRevealed() < i + 1}
        item={item}
        i={i}
        activeIdx={this.state.idx}
        isCompact={this.props.isCompact}
        harnessInline={harnessInline}
        harnessInsertAfter={harnessInsertAfter}
      />
    );
  };

  renderRevealBounceButton = (): React.ReactNode => {
    if (
      this.props.revealAll ||
      this.state.revealed >= this.props.items.length - 2
    ) {
      return <></>;
    }
    return (
      <button
        onClick={this.onReveal}
        className="text-blue-500 animate-smallBounce"
      >
        <div
          className="animate-bounce bg-blue-500 p-2 w-10 h-10 ring-1 ring-slate-900/5 shadow-lg rounded-full flex items-center justify-center"
          id="reveal-step-btn"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </button>
    );
  };

  render() {
    if (this.props.items.length > 0) {
      // first 2 rows are "given" and "prove"
      const given = this.props.items[0];
      const prove = this.props.items[1];
      return (
        <>
          {this.renderPremise("Given", given)}
          {this.renderPremise("Prove", prove)}
          <div className="h-8"></div>
          <div className="py-2 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-lg font-bold ml-6">
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="opacity-0">0</div>
              <div>Statement</div>
            </div>
            <div className="flex flex-row justify-between align-baseline">
              <div>Reason</div>
            </div>
          </div>
          {this.props.items.slice(2).map((item, i) => this.renderRow(item, i))}
          <div className="w-full mt-4 text-right font-semibold text-base tracking-wide text-slate-800">
            <div>Q.E.D.</div>
          </div>
          <div className="w-full flex justify-center">
            <div id="reveal-btn-container">
              {this.renderRevealBounceButton()}
            </div>
          </div>
        </>
      );
    }
    return <></>;
  }
}

export interface ProofRowHarnessInlineProps {
  stepNumber: string;
  statementDsl: string;
  reasonDsl: string;
  /** When the source line is the new-step placeholder, show this in the statement column. */
  harnessEmptyStepHint?: string;
  reasonNames: string[];
  editing: null | {
    field: "statement" | "reason";
    statementDraft: string;
    reasonDraft: string;
  };
  onBeginEdit: (stepKey: string, field: "statement" | "reason") => void;
  onDraftChange: (
    patch: Partial<{
      statementDraft: string;
      reasonDraft: string;
      field: "statement" | "reason";
    }>,
  ) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onSelectRow: (stepKey: string) => void;
}

interface ProofRowProps {
  isActive: boolean;
  isTutorial: boolean;
  revealed: boolean;
  item: ProofTextItem;
  i: number;
  depends: boolean;
  isCompact: boolean;
  activeIdx: number;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  harnessInline?: ProofRowHarnessInlineProps;
  /** When set, a “+” insert control is rendered inside the harness row (active proof step). */
  harnessInsertAfter?: () => void;
}
export class ProofRow extends React.Component<ProofRowProps> {
  private idPrefix = "prooftext-";
  private reasonInputRef = React.createRef<HTMLInputElement>();
  private textClr = () => {
    let css = this.props.isActive
      ? `text-slate-900 font-semibold stroke-slate-900 `
      : this.props.depends
        ? `text-slate-800 `
        : `text-slate-400 `;
    return css;
  };

  private borderClr = () => {
    return this.props.isActive || this.props.depends
      ? "border-slate-800"
      : "border-slate-400";
  };

  private bgClr = () => {
    return this.props.item.isIncorrect
      ? "bg-red-500/10"
      : this.props.isActive
        ? "bg-blue-100"
        : this.props.depends
          ? "bg-slate-50"
          : "bg-transparent";
  };

  private numClass = (): string => {
    const inc = this.props.item.isIncorrect;
    if (this.props.isActive && inc) {
      return "bg-red-200 text-red-900 border border-red-300";
    }
    if (this.props.isActive) {
      return "bg-blue-700 text-white";
    }
    if (this.props.i > this.props.activeIdx - 2) {
      return "bg-white border-2 border-slate-500 text-slate-500";
    }
    if (this.props.depends) {
      return "bg-slate-400 text-black";
    }
    return "bg-slate-200 text-black";
  };

  private harnessShiftEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      this.props.harnessInline?.onCommitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.props.harnessInline?.onCancelEdit();
    }
  };

  render() {
    const h = this.props.isCompact ? "h-12" : "h-16";
    const fontSize = this.props.isCompact ? "text-md" : "text-lg";
    const padding = "py-2";
    const { harnessInline: hi } = this.props;
    const incorrectBg = this.props.item.isIncorrect ? "bg-red-500/10" : "";
    const num = (
      <div
        className={`${this.numClass()} font-bold w-8 h-8 rounded-2xl flex justify-center items-center flex-row`}
      >
        {this.props.i + 1}
      </div>
    );
    const btnStyle = ` border-b-2 border-l-4 border-gray-300 border-l-slate-500 ml-6  w-full ${h} ${fontSize} focus:outline-none`;
    const harnessRowChrome = ` border-b-2 border-l-4 border-gray-300 border-l-slate-500 ml-6  w-full ${fontSize} focus:outline-none`;

    if (hi && !this.props.revealed) {
      const ed = hi.editing;
      const reasonTypeAhead =
        ed?.field === "reason"
          ? (ed.reasonDraft.match(/^[^()]*/)?.[0]?.trim() ?? "")
          : "";
      const filtered =
        ed?.field === "reason" && reasonTypeAhead.length > 0
          ? hi.reasonNames.filter((n) =>
              n.toLowerCase().includes(reasonTypeAhead.toLowerCase()),
            )
          : [];
      // Match default proof row height when not editing; only grow while a field is open.
      const outerRowClass = ed
        ? ed.field === "statement"
          ? this.props.isCompact
            ? "min-h-28"
            : "min-h-40"
          : this.props.isCompact
            ? "min-h-16"
            : "min-h-20"
        : h;

      return (
        <div
          className={`flex flex-row justify-start ${outerRowClass} ${
            ed ? " relative z-[60] overflow-visible" : ""
          }`}
        >
          <div
            id={`${this.idPrefix}${this.props.item.k}`}
            className={`flex flex-row flex-1 w-full items-stretch overflow-visible ${this.bgClr()}${harnessRowChrome}${ed ? "" : ` ${h}`}`}
          >
            <div
              className={`${this.textClr()} ${this.borderClr()} grid grid-rows-1 grid-cols-2 h-full min-h-0 min-w-0 flex-1 overflow-visible`}
            >
              <div
                className={`flex flex-row justify-start gap-8 -ml-[18px] items-center align-baseline ${padding} min-h-0 min-w-0 overflow-visible`}
              >
                <button
                  type="button"
                  className="shrink-0 cursor-pointer focus:outline-none flex flex-col justify-center"
                  onClick={() => hi.onSelectRow(this.props.item.k)}
                >
                  {num}
                </button>
                <div
                  className="proof-row-edit-area min-w-0 flex-1 flex flex-col justify-center min-h-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!this.props.isActive) {
                      hi.onSelectRow(this.props.item.k);
                    } else {
                      hi.onBeginEdit(this.props.item.k, "statement");
                    }
                  }}
                >
                  {ed?.field === "statement" ? (
                    <textarea
                      className="w-full min-h-0 flex-1 resize-none font-mono text-xs leading-snug border border-slate-400 rounded px-1 py-0.5 bg-white text-slate-900"
                      title="Shift+Enter: check proof · Esc: cancel"
                      placeholder="Proof DSL · Shift+Enter · Esc"
                      rows={3}
                      value={ed.statementDraft}
                      aria-label="Statement (proof DSL)"
                      onChange={(e) =>
                        hi.onDraftChange({ statementDraft: e.target.value })
                      }
                      onKeyDown={this.harnessShiftEnter}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div
                      className={`${this.textClr()} text-left break-words cursor-text shrink`}
                    >
                      {hi.harnessEmptyStepHint ? (
                        <span className="text-slate-400 italic font-mono text-xs">
                          {hi.harnessEmptyStepHint}
                        </span>
                      ) : (
                        this.props.item.v(
                          this.props.isActive || this.props.depends,
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`proof-row-edit-area -ml-[9px] flex min-h-0 min-w-0 overflow-visible ${padding} shrink flex-row justify-start items-center align-baseline`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!this.props.isActive) {
                    hi.onSelectRow(this.props.item.k);
                  } else {
                    hi.onBeginEdit(this.props.item.k, "reason");
                  }
                }}
              >
                {ed?.field === "reason" ? (
                  <>
                    <input
                      ref={this.reasonInputRef}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full h-8 shrink-0 font-mono text-xs leading-none border border-slate-400 rounded px-2 py-1 bg-white text-slate-900"
                      title="Shift+Enter: check proof · Esc: cancel"
                      placeholder="reason(args) · type to filter · Shift+Enter"
                      value={ed.reasonDraft}
                      aria-label="Reason (proof DSL)"
                      onChange={(e) =>
                        hi.onDraftChange({ reasonDraft: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          hi.onCancelEdit();
                          return;
                        }
                        this.harnessShiftEnter(e);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ReasonPickerPopover
                      open={
                        ed.reasonDraft.trim().length > 0 && filtered.length > 0
                      }
                      anchorRef={this.reasonInputRef}
                      names={filtered}
                      onPick={(name) => {
                        const prev = ed.reasonDraft;
                        const paren = prev.indexOf("(");
                        const keepArgs =
                          paren > 0 && prev.startsWith(name + "(");
                        hi.onDraftChange({
                          reasonDraft: keepArgs ? prev : `${name}()`,
                        });
                      }}
                    />
                  </>
                ) : (
                  <div
                    className={`px-2 rounded-md py-1 text-left ${
                      this.props.isActive &&
                      Boolean(this.props.item.reason) &&
                      this.props.item.reason !== "Given"
                        ? "border-black border-2"
                        : ""
                    }`}
                  >
                    {this.props.item.reason}
                  </div>
                )}
              </div>
            </div>
            {this.props.harnessInsertAfter ? (
              <div className="flex shrink-0 flex-col items-center justify-center pl-2 pr-2">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-600 text-xl font-light leading-none text-blue-600 hover:bg-blue-50/90"
                  aria-label="Insert step after this step"
                  title="Insert step after"
                  onClick={(e) => {
                    e.stopPropagation();
                    this.props.harnessInsertAfter?.();
                  }}
                >
                  +
                </button>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex flex-row justify-start ${h} ${incorrectBg}`}
        id={this.props.isTutorial ? `${this.props.item.k}-tutorial` : ""}
      >
        {this.props.revealed ? (
          <button
            id={`${this.idPrefix}${this.props.item.k}`}
            className={btnStyle}
            onClick={this.props.onClick}
          >
            <div
              className={`${this.textClr()} ${this.borderClr()} ${padding}  grid grid-rows-1 grid-cols-2`}
            >
              <div className="flex flex-row justify-start gap-8 -ml-[18px] align-baseline">
                {num}
                <div></div>
              </div>
            </div>
          </button>
        ) : (
          <div className={`flex flex-row justify-start ${h} w-full`}>
            <button
              id={`${this.idPrefix}${this.props.item.k}`}
              onClick={this.props.onClick}
              className={this.bgClr() + btnStyle}
            >
              <div
                className={`${this.textClr()} ${this.borderClr()} grid grid-rows-1 grid-cols-2 h-full`}
              >
                <div
                  className={`flex flex-row justify-start gap-8 -ml-[18px] items-center align-baseline ${padding}`}
                >
                  {num}
                  <div className="shrink">
                    {this.props.item.v(
                      this.props.isActive || this.props.depends,
                    )}
                  </div>
                </div>
                <div
                  className={`-ml-[9px] flex flex-row justify-start align-baseline items-center ${padding} shrink`}
                  id={`reason-${this.props.i + 1}`}
                >
                  <div
                    className={`px-2 rounded-md py-1 ${
                      this.props.isActive &&
                      Boolean(this.props.item.reason) &&
                      this.props.item.reason !== "Given"
                        ? "border-black border-2"
                        : ""
                    }`}
                  >
                    {this.props.item.reason}
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }
}

const highlightBar = (active: boolean, h: string) => {
  return (
    <div
      id="active-bar"
      className={`w-[10px] ${h} transition-all ease-in-out duration-300 ${
        active
          ? "border-l-[10px] border-double border-blue-500"
          : "border-l-[10px] border-double border-transparent"
      }`}
    ></div>
  );
};
