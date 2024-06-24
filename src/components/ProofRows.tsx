import React from "react";
import { ProofTextItem } from "../core/types/stepTypes";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
  reliesOn?: Map<string, Set<string>>;
}
export interface ProofRowsState {
  idx: number;
}
export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";
  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      idx: 0,
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyboardPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyboardPress);
  }

  onKeyboardPress = (event: KeyboardEvent) => {
    let newIdx = this.state.idx;
    if (
      event.key === "ArrowDown" &&
      this.state.idx < this.props.items.length - 1
    ) {
      newIdx = this.state.idx + 1;
    } else if (event.key === "ArrowUp" && this.state.idx > 0) {
      newIdx = this.state.idx - 1;
    }
    if (newIdx !== this.state.idx && this.props.items[newIdx] !== undefined) {
      const newActive = this.props.items[newIdx].k;
      this.setState({
        idx: newIdx,
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
          active
        );
      }
      this.setState({
        idx: newIdx,
      });
      this.props.onClick(active);
    }
  };

  highlightBar = (k: string) => {
    return (
      <div
        id="active-bar"
        className="w-4 h-16 transition-all ease-in-out duration-300"
        style={
          this.props.active === k ? { borderLeft: "10px double #9A76FF" } : {}
        }
      ></div>
    );
  };

  renderPremise = (premise: string, item: ProofTextItem) => {
    return (
      <div className="flex flex-row justify-start">
        {this.highlightBar(item.k)}
        <button
          id={`${this.idPrefix}${item.k}`}
          onClick={this.onClick}
          className="py-4 border-b-2 border-gray-300 text-lg w-full h-16 ml-2"
        >
          <div className="flex flex-row justify-start gap-8 align-baseline ml-2">
            <div className="font-semibold">{`${premise}:`} </div>
            {item.v}
          </div>
        </button>
      </div>
    );
  };

  renderRow = (item: ProofTextItem, i: number) => {
    const activeItem = this.props.items[this.state.idx];
    const isActive =
      activeItem &&
      (activeItem.k === item.k || activeItem.dependsOn?.has(item.k));
    const textColor = isActive ? "text-slate-800" : "text-slate-400";
    const strokeColor = isActive ? "border-slate-800" : "border-gray-300";
    return (
      <div className="flex flex-row justify-start h-16" key={item.k}>
        {this.highlightBar(item.k)}
        <button
          id={`${this.idPrefix}${item.k}`}
          onClick={this.onClick}
          className="border-gray-300 border-b-2 w-full h-16 ml-2 text-lg"
        >
          <div
            className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-2`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="text-slate-400 font-bold">{i + 1}</div>
              {item.v}
            </div>
            <div className="flex flex-row justify-start align-baseline">
              {item.reason}
            </div>
          </div>
        </button>
      </div>
    );
  };

  render() {
    // TODO change style based on the state
    if (this.props.items.length > 0) {
      // first 2 rows are "given" and "prove"
      const given = this.props.items[0];
      const prove = this.props.items[1];
      return (
        <>
          {this.renderPremise("Given", given)}
          {this.renderPremise("Prove", prove)}
          <div className="h-24"></div>
          <div className="py-4 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-lg font-bold ml-6">
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="opacity-0">0</div>
              <div>Statement</div>
            </div>
            <div>Reason</div>
          </div>
          {this.props.items.slice(2).map((item, i) => this.renderRow(item, i))}
        </>
      );
    }
    return <></>;
  }
}
