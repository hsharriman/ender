import React from "react";
import { DiagramContent } from "../core/diagramContent";
import { StaticProofTextItem } from "../core/types/stepTypes";
import { Reason } from "../core/types/types";
import { Question } from "../questions/funcTypeQuestions";
import { GIVEN_ID } from "../theorems/utils";
import { StaticDiagram } from "./StaticDiagram";

export interface StaticAppPageProps {
  name: string;
  pageNum: number;
  ctx: DiagramContent;
  reasons: Reason[];
  texts: StaticProofTextItem[];
  givenText: JSX.Element;
  provesText: JSX.Element;
  questions: Question[];
}

interface StaticAppPageState {
  page: number;
  activeReason: number;
}

export class StaticAppPage extends React.Component<
  StaticAppPageProps,
  StaticAppPageState
> {
  constructor(props: StaticAppPageProps) {
    super(props);
    // build diagram from given construction
    this.state = {
      page: this.props.pageNum,
      activeReason: -1,
    };
  }

  renderRow = (item: StaticProofTextItem, i: number) => {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    const reasonStyle =
      item.reason === "Given" ? "" : "text-blue-600 underline";
    return (
      <div className="flex flex-row justify-start h-12" key={`static-row-${i}`}>
        <div
          id={`proof-row-control-${i}`}
          className={`border-gray-300 w-10/12 h-12 ml-2 text-lg ${
            i % 2 !== 0 ? "bg-slate-100" : "bg-transparent"
          }`}
        >
          <div
            className={`${textColor} ${strokeColor} grid grid-rows-1 grid-cols-2 pt-2`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="text-slate-400 font-bold">{i + 1}</div>
              {item.stmt}
            </div>
            <button
              className={`${reasonStyle} flex flex-row justify-start align-baseline`}
              onClick={this.showReason(i)}
            >
              {item.reason}
            </button>
          </div>
        </div>
      </div>
    );
  };

  showReason = (i: number) => () => {
    if (this.state.activeReason !== i) {
      this.setState({ activeReason: i });
    } else if (this.state.activeReason === i) {
      this.clearReason();
    }
  };

  clearReason = () => {
    this.setState({ activeReason: -1 });
  };

  renderReason = (item: Reason) => {
    return (
      <>
        <div className="font-bold text-base text-slate-500 pb-2 flex justify-between">
          Reasons Applied:
          <button
            className="bold text-black w-4 h-4 rounded-md text-base mr-3"
            onClick={this.clearReason}
          >
            X
          </button>
        </div>
        <div className="flex flex-col justify-start pb-2">
          <div className="font-semibold text-lg">{item.title}</div>
          <div className="text-lg">{item.body}</div>
        </div>
      </>
    );
  };

  render() {
    const numGivens = this.props.texts.filter(
      (item) => item.reason === "Given"
    ).length;
    return (
      <div className="top-0 left-0 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] mt-12">
        <div className="w-[900px] h-full flex flex-col ml-12">
          <div className="flex flex-row">
            <div className="flex flex-col mx-4 text-lg">
              <div className="pb-2">
                <div className="font-bold">Given:</div>
                <div>{this.props.givenText}</div>
              </div>
              <div>
                <div className="font-bold">Prove:</div>
                <div>{this.props.provesText}</div>
              </div>
            </div>
            <StaticDiagram
              svgIdSuffix={`static-${GIVEN_ID}`}
              ctx={this.props.ctx}
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
          {this.props.texts.map((item, i) => this.renderRow(item, i))}
        </div>
        <div className="min-w-[400px] max-w-[500px]">
          <div className="flex flex-col justify-start">
            {this.state.activeReason !== -1 &&
              this.renderReason(
                this.props.reasons[this.state.activeReason - numGivens]
              )}
          </div>
        </div>
      </div>
    );
  }
}
