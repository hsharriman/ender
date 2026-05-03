import React from "react";
import { ProofTextItem } from "../../core/types/stepTypes";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void;
  isCompact: boolean;
  reliesOn?: Map<string, Set<string>>;
  isTutorial?: boolean;
  /** When true, every proof step row is expanded (no reveal animation). */
  revealAll?: boolean;
}

export interface ProofRowsState {
  idx: number;
  revealed: number;
}

export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";

  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      idx: 0,
      revealed: 0,
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
        });
        if (k) this.props.onClick(k);
      }
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
      reveal = this.state.idx > rev;
    } else if (event.key === "ArrowUp" && this.state.idx > 0) {
      newIdx = this.state.idx - 1;
      reveal = false;
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
    const depends = (activeItem && activeItem.dependsOn?.has(item.k)) || false;

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
}

class ProofRow extends React.Component<ProofRowProps> {
  private idPrefix = "prooftext-";

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

  render() {
    const h = this.props.isCompact ? "h-12" : "h-16";
    const fontSize = this.props.isCompact ? "text-md" : "text-lg";
    const padding = "py-2";
    const incorrectBg = this.props.item.isIncorrect ? "bg-red-500/10" : "";
    const num = (
      <div
        className={`${this.numClass()} font-bold w-8 h-8 rounded-2xl flex justify-center items-center flex-row`}
      >
        {this.props.i + 1}
      </div>
    );
    const btnStyle = ` border-b-2 border-l-4 border-gray-300 border-l-slate-500 ml-6  w-full ${h} ${fontSize} focus:outline-none`;

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
