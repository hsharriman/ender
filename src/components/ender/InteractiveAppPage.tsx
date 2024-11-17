import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { Question } from "../../core/testinfra/questions/funcTypeQuestions";
import { logEvent } from "../../core/testinfra/testUtils";
import { ProofTextItem } from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { getReasonFn } from "../../theorems/utils";
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
  highlightCtx: DiagramContent;
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
            rowHeight={rowsCompact ? 46 : 64}
          />
        )}
        <div className="top-0 left-0 max-w-[1800px] min-w-[1500px] font-notoSans text-slate-800 grid grid-rows-1 grid-cols-12 pl-6">
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
            className="col-start-7 col-span-5 grid grid-rows-2 mx-8 max-w-[1020px] min-w-[720px]"
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
                highlightCtx={this.props.highlightCtx}
              />
            </div>

            <div className="mx-4 max-w-[1000px] min-w-[650px] h-44">
              <ReasonText
                activeFrame={this.state.activeFrame}
                textFn={getReasonFn(this.props.reasonMap)}
                displayHeader={true}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}
