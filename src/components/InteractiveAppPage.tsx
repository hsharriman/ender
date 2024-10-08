import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { AspectRatio } from "../core/svg/svgTypes";
import { ProofTextItem } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { logEvent } from "../core/utils";
import { Question } from "../questions/funcTypeQuestions";
import { getReasonFn } from "../theorems/utils";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";

export interface InteractiveAppPageProps {
  name: string;
  ctx: DiagramContent;
  linkedTexts: ProofTextItem[];
  reasonMap: Map<string, Reason>;
  miniCtx: DiagramContent;
  pageNum: number;
  questions: Question[];
  isTutorial?: boolean;
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

  onMouseEnter = () => {
    logEvent("m", {
      c: "mi",
      v: "",
    });
  };

  onMouseLeave = () => {
    logEvent("ml", {
      c: "mi",
      v: "",
    });
  };

  render() {
    const rowsCompact = this.props.ctx.frames.length > 10;
    return (
      <>
        {this.props.ctx.deps && (
          <ReliesOn
            reliesOn={this.props.ctx.deps}
            activeFrame={this.state.activeFrame}
            rowHeight={rowsCompact ? 46 : 64}
          />
        )}
        <div className="top-0 left-0 max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-12 pl-6">
          <div id="proof-steps" className="col-start-1 col-span-4 w-[700px]">
            <div className="pt-8">
              <ProofRows
                items={this.props.linkedTexts}
                active={this.state.activeFrame}
                onClick={this.handleClick}
                isTutorial={this.props.isTutorial}
                isCompact={rowsCompact}
              />
            </div>
          </div>
          <div
            id="canvas-container"
            className="grid grid-rows-2 ml-4 sticky left-[780px] max-w-[1020px] min-w-[720px]"
          >
            <div className="pt-4">
              <Diagram
                height="auto"
                width={
                  this.props.ctx.aspect === AspectRatio.Landscape
                    ? "600px"
                    : "400px"
                }
                svgIdSuffix={`construction`}
                activeFrame={this.state.activeFrame}
                ctx={this.props.ctx}
                miniScale={false}
                isTutorial={this.props.isTutorial}
              />
            </div>

            <div className="flex flex-row max-w-[1000px] min-w-[700px] h-44">
              {this.props.miniCtx.frames.find(
                (s) => s === this.state.activeFrame
              ) && (
                <div
                  className="col-span-3"
                  onMouseEnter={this.onMouseEnter}
                  onMouseLeave={this.onMouseLeave}
                >
                  <Diagram
                    width={
                      this.props.ctx.aspect === AspectRatio.Landscape
                        ? "200px"
                        : "150px"
                    }
                    height="100%"
                    svgIdSuffix={`mini`}
                    activeFrame={this.state.activeFrame}
                    ctx={this.props.miniCtx}
                    miniScale={true}
                  />
                </div>
              )}
              <div className="col-span-5 pl-2 max-w-[500px] min-w-[460px]">
                <ReasonText
                  activeFrame={this.state.activeFrame}
                  textFn={getReasonFn(this.props.reasonMap)}
                  displayHeader={true}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
