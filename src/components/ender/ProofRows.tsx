import React from "react";
import { addTutorialActive, logEvent } from "../../core/testinfra/testUtils";
import { ProofTextItem } from "../../core/types/stepTypes";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
  isCompact: boolean;
  reliesOn?: Map<string, Set<string>>;
  isTutorial?: boolean;
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

  onReveal = () => {
    if (this.state.revealed < this.props.items.length - 2) {
      const newIdx = this.state.revealed + 1;
      this.setState({ revealed: newIdx, idx: newIdx + 1 });
      const newId = `s${newIdx}`;
      this.props.onClick(newId);

      // tutorial
      if (this.props.isTutorial) {
        addTutorialActive("reveal-step-btn");
      }

      logEvent("c", {
        c: "pr-r",
        v: `s${newIdx}`,
      });
    }
  };

  onKeyboardPress = (event: KeyboardEvent) => {
    let newIdx = this.state.idx;
    let reveal =
      this.state.idx > 0 && this.state.revealed < this.props.items.length - 2;
    if (
      event.key === "ArrowDown" &&
      this.state.idx < this.props.items.length - 1
    ) {
      newIdx = this.state.idx + 1;
      reveal = this.state.idx > this.state.revealed; // false if active idx is not beyond what has been revealed
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

      // tutorial
      if (this.props.isTutorial) {
        addTutorialActive(`${newActive}-tutorial`);
      }
      logEvent("a", {
        c: "pr",
        v: newActive,
      });
    }
  };

  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const active = event.currentTarget.id.replace(this.idPrefix, "");
    if (active !== this.props.active) {
      const newIdx = this.props.items.findIndex((item) => item.k === active);
      if (newIdx === -1) {
        console.error(
          "couldn't find match in ProofRows items array for key: ",
          active
        );
      }
      this.setState({
        idx: newIdx,
        revealed:
          newIdx - 1 > this.state.revealed ? newIdx - 1 : this.state.revealed,
      });
      this.props.onClick(active);

      // tutorial
      if (this.props.isTutorial) {
        addTutorialActive(`${this.props.items[newIdx].k}-tutorial`);
      }
      logEvent("c", {
        c: "pr",
        v: active,
      });
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
    // if the active row is given or prove, focus all the proof rows
    const depends = (activeItem && activeItem.dependsOn?.has(item.k)) || false;
    return (
      <ProofRow
        isActive={isActive}
        depends={depends}
        onClick={this.onClick}
        isTutorial={this.props.isTutorial || false}
        revealed={this.state.revealed < i + 1}
        item={item}
        i={i}
        activeIdx={this.state.idx}
        isCompact={this.props.isCompact}
      />
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
              {this.state.revealed < this.props.items.length - 2 && (
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
              )}
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
export class ProofRow extends React.Component<ProofRowProps> {
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
    return this.props.isActive
      ? "bg-blue-100"
      : this.props.depends
      ? "bg-slate-50"
      : "bg-transparent";
  };

  render() {
    // if the active row is given or prove, focus all the proof rows
    const h = this.props.isCompact ? "h-12" : "h-16";
    const fontSize = this.props.isCompact ? "text-md" : "text-lg";
    const padding = this.props.isCompact ? "py-2" : "py-2";
    const num = (
      <div
        className={`${
          this.props.isActive
            ? "bg-blue-700 text-white"
            : this.props.i > this.props.activeIdx - 2
            ? "bg-white border-2 border-slate-500 text-slate-500"
            : this.props.depends
            ? "bg-slate-400 text-black"
            : "bg-slate-200 text-black"
        } font-bold w-8 h-8 rounded-2xl flex justify-center items-center flex-row`}
      >
        {this.props.i + 1}
      </div>
    );
    const btnStyle = ` border-l-4 border-l-gray-800 ml-6 border-gray-300 border-b-2 w-full ${h} ${fontSize} focus:outline-none`;
    return (
      <div
        className={`flex flex-row justify-start ${h}`}
        key={this.props.item.k}
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
                className={`${this.textClr()} ${this.borderClr()} grid grid-rows-1 grid-cols-2  h-full`}
              >
                <div
                  className={`flex flex-row justify-start gap-8 -ml-[18px] items-center align-baseline ${padding}`}
                >
                  {num}
                  <div className="shrink">
                    {this.props.item.v(this.props.isActive)}
                  </div>
                </div>
                <div
                  className={`-ml-[9px] flex flex-row justify-start align-baseline items-center ${padding} shrink`}
                  id={`reason-${this.props.i + 1}`}
                >
                  <div
                    className={`px-2 rounded-md py-1 ${
                      this.props.isActive && this.props.item.reason !== "Given"
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
      className={`w-4 ${h} transition-all ease-in-out duration-300 ${
        active ? "border-l-[10px] border-double border-blue-500" : ""
      }`}
    ></div>
  );
};
