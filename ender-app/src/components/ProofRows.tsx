import React from "react";
import { ProofTextItem } from "../core/types";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
}
export interface ProofRowsState {
  active: string;
}
export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";
  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      active: this.props.active,
    };
  }

  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const idx = event.currentTarget.id.replace(this.idPrefix, "");
    if (idx !== this.state.active) {
      this.setState({
        active: idx,
      });
      this.props.onClick(idx);
    }
  };

  highlightBar = (k: string) => {
    return (
      <div
        id="active-bar"
        className="w-4 h-16"
        style={
          this.state.active === k ? { borderLeft: "10px double #9A76FF" } : {}
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
          className="py-4 border-b-2 border-gray-300 text-lg w-10/12 h-16 ml-2"
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
    return (
      <>
        <div className="flex flex-row justify-start h-16">
          {this.highlightBar(item.k)}
          <button
            id={`${this.idPrefix}${item.k}`}
            onClick={this.onClick}
            className="py-4 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-lg w-10/12 h-16 ml-2"
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="text-slate-400 font-bold">{i + 1}</div>
              {item.v}
            </div>
            <div className="flex flex-row justify-start align-baseline">
              {item.reason}
            </div>
          </button>
        </div>
      </>
    );
  };

  render() {
    // TODO change style based on the state
    if (this.props.items.length > 0) {
      // first 2 rows are "given" and "prove"
      const given = this.props.items[0];
      const prove = this.props.items[1];
      console.log(this.state.active);
      return (
        <>
          {this.renderPremise("Given", given)}
          {this.renderPremise("Prove", prove)}
          <div className="h-24"></div>
          <div className="py-4 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-lg w-10/12 font-bold ml-6">
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
