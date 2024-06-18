import React from "react";
import { Content } from "../core/diagramContent";
import { ProofTextItem } from "../core/types/stepTypes";
import { InteractiveLayoutProps, Reason } from "../core/types/types";
import { GIVEN_ID, PROVE_ID, getReasonFn } from "../theorems/utils";
import { Diagram } from "./Diagram";
import { ProofRows } from "./ProofRows";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";
import { TestQuestions } from "./TestQuestions";

export interface InteractiveAppPageProps extends InteractiveLayoutProps {
  pageNum: number;
  reset: boolean;
  onClickCallback: () => void;
  activeQuestionIndex: number;
  changeActiveQuestionIndex: (newIndex: number) => void;
  proofName: string;
  answers: { [question: string]: string };
  updateAnswers: (proofName: string, question: string, answer: string) => void;
}

interface InteractiveAppPageState {
  activeFrame: string;
  localAnswers: { [question: string]: string };
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
      localAnswers: {},
    };
  }

  buildCtx = () => {
    if (!this.props.reset) return;
    // reset stored variables
    this.ctx = this.props.baseContent(true);
    this.linkedTexts = [];
    this.reasonMap = new Map<string, Reason>();
    this.handleClick("given");

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
      step.diagram(this.ctx, s, true);
      if (step.dependsOn) {
        const depIds = step.dependsOn.map((i) => `s${i}`);
        this.ctx.reliesOn(s, depIds);
        textMeta = { dependsOn: new Set(depIds) };
      }
      this.reasonMap.set(s, step.reason);
      this.linkedTexts.push({
        ...textMeta,
        k: s,
        v: step.text({ ctx: this.ctx }),
        reason: step.reason.title,
      });
    });
    this.props.onClickCallback();
  };

  handleClick = (active: string) => {
    if (active !== this.state.activeFrame) {
      this.setState({
        activeFrame: active,
      });
    }
  };

  handleAnswerUpdate = (question: string, answer: string) => {
    this.setState(
      (prevState) => ({
        localAnswers: {
          ...prevState.localAnswers,
          [question]: answer,
        },
      }),
      () => {
        this.props.updateAnswers(this.props.proofName, question, answer);
      }
    );
  };

  render() {
    // TODO ideally ctx should be formatted in a way that react can detect when it changes, this hack is necessary
    // because only calling this method once means that the ctx doesn't update between pages
    this.buildCtx();
    return (
      <>
        {this.ctx.getReliesOn() && (
          <ReliesOn
            reliesOn={this.ctx.getReliesOn()}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )}
        <div className="top-0 left-0 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-2 pl-6 gap-4">
          <div id="proof-steps" className="col-start-1 w-[700px]">
            <div className="pt-16">
              <ProofRows
                items={this.linkedTexts}
                active={this.state.activeFrame}
                onClick={this.handleClick}
                refresh={this.props.reset}
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
          </div>
          <div className="w-[400px] h-fit col-start-3 mt-12 p-8 rounded-lg border-dotted border-4 border-violet-300">
            <TestQuestions
              questions={this.props.questions}
              answers={this.props.answers}
              onAnswerUpdate={this.handleAnswerUpdate}
              proofName={this.props.proofName}
              proofType="Interactive"
              activeQuestionIndex={this.props.activeQuestionIndex}
              changeActiveQuestionIndex={this.props.changeActiveQuestionIndex}
            />
          </div>
        </div>
      </>
    );
  }
}
