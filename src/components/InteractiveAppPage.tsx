import React from "react";
import { Content } from "../core/diagramContent";
import { ProofTextItem, Step, StepMeta } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { Question } from "../questions/completeQuestions";
import { GIVEN_ID, PROVE_ID, getReasonFn } from "../theorems/utils";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";
import { TestQuestions } from "./TestQuestions";

export interface InteractiveAppPageProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
  miniContent: Content;
  questions: Question[];
  pageNum: number;
}

interface InteractiveAppPageState {
  activeFrame: string;
}
export class InteractiveAppPage extends React.Component<
  InteractiveAppPageProps,
  InteractiveAppPageState
> {
  linkedTexts: ProofTextItem[] = [];
  reasonMap = new Map<string, Reason>();
  ctx: Content;
  constructor(props: InteractiveAppPageProps) {
    super(props);
    this.ctx = this.props.baseContent(true);
    this.state = {
      activeFrame: "given",
    };
  }

  buildCtx = () => {
    // reset stored variables
    this.ctx = this.props.baseContent(true);
    this.linkedTexts = [];
    this.reasonMap = new Map<string, Reason>();

    // GIVEN
    this.ctx.addFrame(GIVEN_ID);
    this.props.givens.diagram(this.ctx, GIVEN_ID, false);

    // PROVE
    this.ctx.addFrame(PROVE_ID);
    this.props.proves.diagram(this.ctx, PROVE_ID, true);

    // add given and prove to linkedTexts
    this.linkedTexts.push({
      k: GIVEN_ID,
      v: this.props.givens.ticklessText(this.ctx),
      alwaysActive: true,
    });
    this.linkedTexts.push({
      k: PROVE_ID,
      v: this.props.proves.text({ ctx: this.ctx }),
      alwaysActive: true,
    });

    this.props.steps.map((step, i) => {
      let textMeta = {};
      const s = this.ctx.addFrame(`s${i + 1}`);
      step.meta.diagram(this.ctx, s, true);
      if (step.dependsOn) {
        const depIds = step.dependsOn.map((i) => `s${i}`);
        this.ctx.reliesOn(s, depIds);
        textMeta = { dependsOn: new Set(depIds) };
      }
      this.reasonMap.set(s, step.reason);
      this.linkedTexts.push({
        ...textMeta,
        k: s,
        v: step.meta.text({ ctx: this.ctx }),
        reason: step.reason.title,
      });
    });
  };

  handleClick = (active: string) => {
    if (active !== this.state.activeFrame) {
      this.setState({
        activeFrame: active,
      });
    }
  };

  render() {
    // To avoid re-building ctx too many times, only build if the activeFrame is "given" (is by default on initial load)
    // TODO ideally ctx should be formatted in a way that react can detect when it changes, this hack is necessary
    // because only calling this method once means that the ctx doesn't update between pages
    if (this.state.activeFrame === "given") {
      this.buildCtx();
    }
    return (
      <>
        {this.ctx.getReliesOn() && (
          <ReliesOn
            reliesOn={this.ctx.getReliesOn()}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )}
        <div className="top-0 left-0 w-screen max-w-[1400px] min-w-[1300px] xl:justify-start h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-2 pt-4 pl-4 gap-4">
          <div id="proof-steps" className="col-start-1">
            <div className="pt-16">
              <ProofRows
                items={this.linkedTexts}
                active={this.state.activeFrame}
                onClick={this.handleClick}
              />
            </div>
          </div>
          <div id="canvas-container" className="col-start-2 row-span-5 ml-4">
            <Diagram
              width="100%"
              height="320px"
              svgIdSuffix={`construction-${this.props.pageNum}`}
              activeFrame={this.state.activeFrame}
              svgElements={this.ctx.allSvgElements(this.props.pageNum, false)}
            />
            <div className="grid grid-rows-1 grid-cols-8 h-44 mt-6">
              <div className="col-span-3">
                <Diagram
                  width="100%"
                  height="100%"
                  svgIdSuffix={`mini-${this.props.pageNum}`}
                  activeFrame={this.state.activeFrame}
                  svgElements={this.props.miniContent.allSvgElements(
                    this.props.pageNum,
                    true
                  )}
                />
              </div>
              <div className="col-span-5">
                <ReasonText
                  activeFrame={this.state.activeFrame}
                  textFn={getReasonFn(this.reasonMap)}
                  displayHeader={true}
                />
              </div>
            </div>
            <div className="col-span-5 pl-6">
              <div>
                <TestQuestions questions={this.props.questions} />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
