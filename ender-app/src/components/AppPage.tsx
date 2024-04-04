import React from "react";
import { BaseSVG } from "../core/svg/BaseSVG";
import { ProofRows } from "./ProofRows";
import { Euclidean } from "./Euclidean";
import { ProofItem } from "./ProofItem";
import { LinkedText } from "./LinkedText";
import { ProofTextItem } from "../core/types";

export interface AppPageProps {
  problemText: string;
  proofText: ProofTextItem[];
  svgElements: (activeFrame: string) => JSX.Element[];
  onResample: () => void;
  onClickCanvas: () => void;
}

interface AppPageState {
  activeFrame: string;
}
export class AppPage extends React.Component<AppPageProps, AppPageState> {
  constructor(props: AppPageProps) {
    super(props);
    this.state = {
      activeFrame: "step3",
    };
  }

  handleClick = (active: string) => {
    if (active !== this.state.activeFrame) {
      this.setState({
        activeFrame: active,
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
          {/* <div id="problem-text">{this.props.problemText}</div> */}
          <div id="resample" onClick={this.props.onResample}></div>
          <div id="canvas-container" className="row-start-1 row-span-5">
            <svg
              id={`construction-svg`}
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              {this.props.svgElements(this.state.activeFrame)}
            </svg>
          </div>
          <ProofRows
            items={this.props.proofText}
            active={this.state.activeFrame}
            onClick={this.handleClick}
          />
        </div>
      </div>
    );
  }
}
