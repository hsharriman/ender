import React from "react";
import { ProofTextItem } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { Question } from "../questions/completeQuestions";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";
import { TestQuestions } from "./TestQuestions";

export interface AppPageProps {
  proofText: ProofTextItem[];
  reliesOn?: Map<string, Set<string>>;
  miniSvgElements: (activeFrame: string) => JSX.Element[];
  reasonText: (activeFrame: string) => Reason;
  svgElements: (activeFrame: string) => JSX.Element[];
  onClickCanvas: () => void;
  questions: Question[];
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
        <div className="top-0 left-0 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-2 pl-6 gap-4">
          <div id="proof-steps" className="col-start-1 w-[700px]">
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
          </div>
          <div className="w-[400px] h-fit col-start-3 mt-12 p-8 rounded-lg border-dotted border-4 border-violet-300">
            <TestQuestions questions={this.props.questions} />
          </div>
        </div>
      </>
    );
  }
}
