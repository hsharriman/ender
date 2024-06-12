import React from "react";
import { Content } from "../core/diagramContent";
import { StaticProofTextItem, StepMeta } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { Question } from "../questions/completeQuestions";
import { Reasons } from "../theorems/reasons";
import { GIVEN_ID } from "../theorems/utils";
import { StaticDiagram } from "./StaticDiagram";
import { TestQuestions } from "./TestQuestions";

export interface StaticAppPageProps {
  questions: Question[];
  pageNum: number;
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
}

interface StaticAppPageState {
  page: number;
}

export class StaticAppPage extends React.Component<
  StaticAppPageProps,
  StaticAppPageState
> {
  reasons: Reason[] = [];
  texts: StaticProofTextItem[] = [];
  constructor(props: StaticAppPageProps) {
    super(props);
    // build diagram from given construction
    this.state = {
      page: this.props.pageNum,
    };
  }

  buildCtxAndText = () => {
    // reset stored variables
    const ctx = this.props.baseContent(true);
    this.reasons = [];
    this.texts = [];

    ctx.addFrame(GIVEN_ID);
    this.props.givens.diagram(ctx, GIVEN_ID, false);
    this.props.steps.map((step) => {
      this.texts.push({
        stmt: step.staticText(),
        reason: step.reason.title,
      });
      if (
        step.reason.body !== "" &&
        step.reason.title !== Reasons.Given.title
      ) {
        this.reasons.push(step.reason);
      }
    });
    return ctx;
  };

  renderRow = (item: StaticProofTextItem, i: number) => {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    return (
      <div className="flex flex-row justify-start h-12" key={`static-row-${i}`}>
        <div
          id={`proof-row-control-${i}`}
          className="border-gray-300 w-10/12 h-12 ml-2 text-normal"
        >
          <div
            className={`${textColor} ${strokeColor} grid grid-rows-1 grid-cols-2 pt-2`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="text-slate-400 font-bold">{i + 1}</div>
              {item.stmt}
            </div>
            <div className="flex flex-row justify-start align-baseline">
              {item.reason}
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderReason = (item: Reason) => {
    return (
      <>
        <div
          className="flex flex-col justify-start pb-2"
          key={`static-reason-${item.title}`}
        >
          <div className="font-semibold text-sm">{item.title}</div>
          <div className="text-sm">{item.body}</div>
        </div>
      </>
    );
  };

  render() {
    const ctx = this.buildCtxAndText();
    return (
      <div className="top-0 left-0 flex flex-row flex-nowrap w-5/6 mt-12">
        <div className="w-[800px] h-full flex flex-col ml-12">
          <div className="flex flex-row">
            <div className="flex flex-col mx-4 w-[300px]">
              <div className="pb-2">
                <div className="font-bold">Given:</div>
                <div>{this.props.givens.staticText()}</div>
              </div>
              <div>
                <div className="font-bold">Prove:</div>
                <div>{this.props.proves.staticText()}</div>
              </div>
            </div>
            <StaticDiagram
              svgIdSuffix={`static-${GIVEN_ID}`}
              svgElements={ctx.allStaticSvgElements(this.props.pageNum)}
              width="400px"
              height="275px"
            />
          </div>
          <div className="py-4 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-normal font-semibold text-slate-500 ml-2 mb-2 w-10/12">
            <div className="flex flex-row justify-start gap-4 align-baseline">
              <div className="opacity-0 pr-4">0</div>
              <div>Statement</div>
            </div>
            <div>Reason</div>
          </div>
          {this.texts.map((item, i) => this.renderRow(item, i))}
        </div>
        <div className="min-w-[300px] max-w-[400px]">
          <div className="flex flex-col justify-start">
            <div className="font-bold text-base text-slate-500 pb-2">
              Reasons Applied:
            </div>
            {this.reasons.map((reason) => this.renderReason(reason))}
          </div>
          <div className="mt-10">
            <TestQuestions questions={this.props.questions} />
          </div>
        </div>
      </div>
    );
  }
}
