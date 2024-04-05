import React from "react";
import { ProofRows } from "./ProofRows";
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
      activeFrame: "given",
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
      <div className="w-screen h-screen bg-slate-50 font-sans text-black grid grid-rows-1 grid-cols-2 p-4">
        <div id="proof-steps" className="col-start-1">
          <div className="pt-16">
            <ProofRows
              items={this.props.proofText}
              active={this.state.activeFrame}
              onClick={this.handleClick}
            />
          </div>
        </div>
        {/* <div id="problem-text">{this.props.problemText}</div> */}
        <div id="canvas-container" className="col-start-2 row-span-5 p-4">
          <svg
            id={`construction-svg`}
            width="100%"
            height="480px"
            xmlns="http://www.w3.org/2000/svg"
          >
            {this.props.svgElements(this.state.activeFrame)}
          </svg>
          <div className="flex flex-row h-48">
            <svg
              id="mini-svg"
              width="60%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            ></svg>
            <div className="flex flex-col justify-start">
              <div className="font-bold text-lg text-slate-500">
                Reason Applied:
              </div>
              <div className="font-bold text-lg">
                Corresponding Angles Postulate
              </div>
              <div className="text-lg">
                Corresponding angles are the angles in congruent or similar
                triangles that have the same measurement.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
