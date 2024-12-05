import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { Legend } from "../../core/diagramSvg/Legend";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { Question } from "../../core/testinfra/questions/testQuestions";
import { logEvent } from "../../core/testinfra/testUtils";
import { ProofTextItem } from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { getReasonFn } from "../../theorems/utils";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn, ReliesRowHeight } from "./ReliesOn";

export interface InteractiveAppPageProps {
  name: string;
  ctx: DiagramContent;
  linkedTexts: ProofTextItem[];
  reasonMap: Map<string, Reason>;
  miniCtx: DiagramContent;
  pageNum: number;
  questions: Question[];
  isTutorial?: boolean;
  highlightCtx: DiagramContent;
  additionCtx: DiagramContent;
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
    const rowsCompact = this.props.ctx.frames.length > 9;
    return (
      <>
        {this.props.ctx.deps && (
          <ReliesOn
            reliesOn={this.props.ctx.deps}
            activeFrame={this.state.activeFrame}
            rowHeight={
              rowsCompact ? ReliesRowHeight.Compact : ReliesRowHeight.Normal
            }
          />
        )}
        <div className="top-0 left-0 max-w-[1800px] min-w-[1500px] font-notoSans text-slate-800 grid grid-rows-1 grid-cols-12 pl-6">
          <div
            id="canvas-container"
            className="col-start-1 col-span-5 flex flex-row flex-wrap justify-center items-start content-start mx-8 w-[700px]"
          >
            <Diagram
              height="auto"
              width={
                this.props.ctx.aspect === AspectRatio.Landscape
                  ? "700px"
                  : "500px"
              }
              svgIdSuffix={`construction`}
              activeFrame={this.state.activeFrame}
              ctx={this.props.ctx}
              miniScale={false}
              isTutorial={this.props.isTutorial}
              highlightCtx={this.props.highlightCtx}
              additionCtx={this.props.additionCtx}
            />
            <div className="w-[650px] mt-2">
              <Legend />
            </div>
            <div className="mt-4 mr-4 w-[650px] h-8">
              <ReasonText
                activeFrame={this.state.activeFrame}
                textFn={getReasonFn(this.props.reasonMap)}
              />
            </div>
          </div>
          <div id="proof-steps" className="col-start-7 col-span-4 w-[700px]">
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
        </div>
      </>
    );
  }
}
