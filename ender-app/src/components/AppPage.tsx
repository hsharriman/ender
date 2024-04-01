import React from "react";
import { BaseSVG } from "../core/svg/BaseSVG";
import { ProofRows } from "./ProofRows";
import { Euclidean } from "./Euclidean";
import { ProofItem } from "./ProofItem";

export interface AppPageProps {
  problemText: string;
  proof: ProofItem[];
  onResample: () => void;
  onClickCanvas: () => void;
}

interface AppPageState {
  activeIdx: number;
}
export class AppPage extends React.Component<AppPageProps, AppPageState> {
  constructor(props: AppPageProps) {
    super(props);
    this.state = {
      activeIdx: 0,
    };
  }

  handleClick = (active: number) => {
    if (active + 1 !== this.state.activeIdx) {
      this.setState({
        activeIdx: active,
      });
    }
  };

  // TODO click away handler that displays the initial construction
  render() {
    return (
      <div className="w-screen h-screen bg-slate-50 font-sans text-black grid grid-rows-1 grid-cols-4">
        <div
          id="proofbox"
          className="border-black border-2 w-100 h-5/6 col-start-2 col-span-2 mt-8 grid grid-rows-8 grid-cols-1"
        >
          <div id="problem-text">{this.props.problemText}</div>
          <div id="resample" onClick={this.props.onResample}></div>
          <div id="canvas-container" className="row-start-3 row-span-4">
            {this.props.proof[this.state.activeIdx].renderConstruction()}
          </div>
          <ProofRows
            items={this.props.proof}
            active={this.state.activeIdx - 1}
            onClick={this.handleClick}
          />
        </div>
      </div>
    );
  }
}
