import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { ProofTextItem } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { Question } from "../questions/funcTypeQuestions";
import { getReasonFn } from "../theorems/utils";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";

export interface InteractiveAppPageProps {
  ctx: DiagramContent;
  linkedTexts: ProofTextItem[];
  reasonMap: Map<string, Reason>;
  miniCtx: DiagramContent;
  pageNum: number;
  questions: Question[];
}

interface InteractiveAppPageState {
  activeFrame: string;
}
export class InteractiveAppPage extends React.Component<
  InteractiveAppPageProps,
  InteractiveAppPageState
> {
  constructor(props: InteractiveAppPageProps) {
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

  render() {
    return (
      <>
        {this.props.ctx.deps && (
          <ReliesOn
            reliesOn={this.props.ctx.deps}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )}
        <div className="top-0 left-0 max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-12 pl-6">
          <div id="proof-steps" className="col-start-1 col-span-4 w-[700px]">
            <div className="pt-8">
              <ProofRows
                items={this.props.linkedTexts}
                active={this.state.activeFrame}
                onClick={this.handleClick}
              />
            </div>
          </div>
          <div
            id="canvas-container"
            className="col-start-7 col-span-5 flex flex-col ml-4"
          >
            <div className="pt-4">
              <Diagram
                width="650px"
                height="300px"
                svgIdSuffix={`construction`}
                activeFrame={this.state.activeFrame}
                ctx={this.props.ctx}
                miniScale={false}
              />
            </div>

            <div className="grid grid-rows-1 grid-cols-8 h-44 mt-12">
              {this.props.miniCtx.frames.find(
                (s) => s === this.state.activeFrame
              ) && (
                <div className="col-span-3">
                  <Diagram
                    width="250px"
                    height="100%"
                    svgIdSuffix={`mini`}
                    activeFrame={this.state.activeFrame}
                    ctx={this.props.miniCtx}
                    miniScale={true}
                  />
                </div>
              )}
              <div className="col-span-5 pl-2">
                <ReasonText
                  activeFrame={this.state.activeFrame}
                  textFn={getReasonFn(this.props.reasonMap)}
                  displayHeader={true}
                />
              </div>
            </div>
          </div>
          {/* <div className="w-[400px] h-fit col-start-3 mt-12 p-8 rounded-lg border-dotted border-4 border-violet-300">
            <TestQuestions questions={this.props.questions} />
          </div> */}
        </div>
      </>
    );
  }
}
