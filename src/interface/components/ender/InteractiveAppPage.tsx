import React from "react";
import { Legend } from "../../core/diagramSvg/Legend";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { DiagramRenderCtx } from "../../core/types/diagramTypes";
import { Reason } from "../../core/types/layoutTypes";
import { ProofTextItem } from "../../core/types/stepTypes";
import { getReasonFn } from "../../theorems/utils";
import { Diagram } from "./Diagram";
import {
  HarnessLlmFeedbackEntry,
  HarnessStepFeedbackPanel,
} from "./HarnessStepFeedbackPanel";
import { HarnessInlineEditConfig, ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn, ReliesRowHeight } from "./ReliesOn";
// import { WaysToProveFigures } from "./WaysToProveFigures";

const EMPTY_INCORRECT_STEPS = new Set<string>();

export interface InteractiveAppPageProps {
  name: string;
  ctx: DiagramRenderCtx;
  linkedTexts: ProofTextItem[];
  reasonMap: Map<string, Reason>;
  miniReasonCtxMap: Map<string, DiagramRenderCtx[]>;
  isTutorial?: boolean;
  /** When true, proof rows show every step (no reveal animation); used by ProofObjHarness */
  proofHarnessMode?: boolean;
  /** Optional: edit proof steps as DSL + reason picker (ProofObjHarness). */
  harnessInlineEdit?: HarnessInlineEditConfig;
  /** Optional: insert a new proof step after the active step (ProofObjHarness). */
  insertProofStepAfter?: (afterStepNumber: string) => void;
  /** Harness: checker-incorrect step ids (numeric strings) for LLM feedback panel. */
  harnessIncorrectStepNumbers?: Set<string>;
  /** Harness: LLM feedback keyed by checker step number. */
  harnessLlmFeedback?: {
    byStepNumber: Map<string, HarnessLlmFeedbackEntry>;
    loading: boolean;
    error?: string;
  };
  highlightCtx: DiagramRenderCtx;
  additionCtx: DiagramRenderCtx;
  diagramAspect: AspectRatio;
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
                this.props.diagramAspect === AspectRatio.Landscape
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
              diagramAspect={this.props.diagramAspect}
            />
            <div className="w-[650px] mt-2">
              <Legend />
            </div>
            <div className="mt-4 mr-4 w-[650px] min-h-8">
              <ReasonText
                activeFrame={this.state.activeFrame}
                textFn={getReasonFn(this.props.reasonMap)}
              />
            </div>
            {/* <WaysToProveFigures
              activeFrame={this.state.activeFrame}
              linkedTexts={this.props.linkedTexts}
              miniReasonCtxMap={this.props.miniReasonCtxMap}
              diagramAspect={this.props.diagramAspect}
            /> */}
            {this.props.proofHarnessMode && this.props.harnessLlmFeedback ? (
              <HarnessStepFeedbackPanel
                activeFrame={this.state.activeFrame}
                harnessInlineEdit={this.props.harnessInlineEdit}
                incorrectStepNumbers={
                  this.props.harnessIncorrectStepNumbers ??
                  EMPTY_INCORRECT_STEPS
                }
                llmByStepNumber={this.props.harnessLlmFeedback.byStepNumber}
                llmLoading={this.props.harnessLlmFeedback.loading}
                llmError={this.props.harnessLlmFeedback.error}
              />
            ) : null}
          </div>
          <div
            id="proof-steps"
            className="col-start-7 col-span-4 w-[700px] overflow-visible z-0"
          >
            <div className="pt-8 overflow-visible">
              <ProofRows
                items={this.props.linkedTexts}
                active={this.state.activeFrame}
                onClick={this.handleClick}
                isTutorial={this.props.isTutorial}
                isCompact={rowsCompact}
                revealAll={this.props.proofHarnessMode}
                harnessInlineEdit={this.props.harnessInlineEdit}
                insertProofStepAfter={this.props.insertProofStepAfter}
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}
