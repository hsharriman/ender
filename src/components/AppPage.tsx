import React from "react";
import { ProofRows } from "./ProofRows";
import { ProofTextItem, Reason } from "../core/types";
import { Diagram } from "./Diagram";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";
import { RadioQuestion } from "./RadioQuestion";

export interface AppPageProps {
  proofText: ProofTextItem[];
  reliesOn?: Map<string, Set<string>>;
  miniSvgElements: (activeFrame: string) => JSX.Element[];
  reasonText: (activeFrame: string) => Reason;
  svgElements: (activeFrame: string) => JSX.Element[];
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
      <>
        {this.props.reliesOn && (
          <ReliesOn
            reliesOn={this.props.reliesOn}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )}
        <div className="top-0 left-0 w-screen max-w-[1400px] min-w-[1300px] xl:justify-start h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-2 pt-4 pl-4 gap-4">
          <div id="proof-steps" className="col-start-1">
            <div className="pt-16">
              <ProofRows
                items={this.props.proofText}
                active={this.state.activeFrame}
                onClick={this.handleClick}
              />
            </div>
            {/* <div>{this.props.reliesOn && new component}</div> */}
          </div>
          <div id="canvas-container" className="col-start-2 row-span-5 ml-4">
            <Diagram
              width="100%"
              height="320px"
              svgIdSuffix="construction"
              activeFrame={this.state.activeFrame}
              svgElements={this.props.svgElements}
            />
            <div className="grid grid-rows-1 grid-cols-8 h-44 mt-6">
              <div className="col-span-3">
                <Diagram
                  width="100%"
                  height="100%"
                  svgIdSuffix="mini"
                  activeFrame={this.state.activeFrame}
                  svgElements={this.props.miniSvgElements}
                />
              </div>
              <div className="col-span-5">
                <ReasonText
                  activeFrame={this.state.activeFrame}
                  textFn={this.props.reasonText}
                  displayHeader={true}
                />
              </div>
            </div>
            <div className="col-span-5 pl-6">
                <RadioQuestion 
                  questionNum="Question 1" 
                  question="Do you agree that segment AC = BD?" 
                  answers={["Yes", "No", "Can't Tell"]}/>
              </div>
          </div>
        </div>
      </>
    );
  }
}
