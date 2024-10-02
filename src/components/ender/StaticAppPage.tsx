import React from "react";
import { DiagramContent } from "../../core/diagramContent";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { Question } from "../../core/testinfra/questions/funcTypeQuestions";
import { logEvent } from "../../core/testinfra/testUtils";
import { StaticProofTextItem } from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { Definition, definitionArr } from "../../theorems/definitions";
import { GIVEN_ID } from "../../theorems/utils";
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
  activeDef: number;
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
      activeDef: -1,
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
    if (this.state.activeReason === i) {
      this.clearReason();
    } else {
      this.setState({ activeReason: i });
      logEvent("c", {
        c: "sr",
        v: this.props.texts[i].reason || "",
      });
    }
  };

  clearReason = () => {
    this.setState({ activeReason: -1 });
  };

  showDef = (i: number) => () => {
    if (this.state.activeDef === i) {
      this.clearDef();
    } else {
      this.setState({ activeDef: i });
      logEvent("c", {
        c: "sd",
        v: definitionArr[i].title,
      });
    }
  };

  clearDef = () => {
    this.setState({ activeDef: -1 });
  };

  renderAllDefinitions = (numGivens: number) => {
    return (
      <div>
        <div className="flex flex-row align-bottom pb-2 leading-9">
          <div className="font-bold text-sm text-slate-500 pr-2 self-end leading-9">
            Symbols and keywords:
          </div>
          {definitionArr.map((item, i) => (
            <span>
              <span
                onClick={this.showDef(i)}
                className="text-lg text-blue-500 underline cursor-pointer self-end"
              >
                {item.symbol}
              </span>
              {i < definitionArr.length - 1 && <span className="pr-1">, </span>}
            </span>
          ))}
        </div>
        <div>
          {this.state.activeDef !== -1 &&
            this.renderDefinition(definitionArr[this.state.activeDef])}
        </div>
      </div>
    );
  };

  renderDefinition = (item: Definition) => {
    return (
      <div className="pb-2">
        <div className="font-bold">{item.title}</div>
        <div>{item.body}</div>
      </div>
    );
  };

  renderReason = (item: Reason) => {
    return (
      <>
        <div className="flex flex-col justify-start pb-2">
          <div className="font-bold text-base text-slate-500 py-2 flex justify-between border-t-2 border-slate-300">
            Reason Applied:
          </div>
          <div className="font-semibold text-base">{item.title}</div>
          <div className="text-base">{item.body}</div>
        </div>
      </>
    );
  };

  render() {
    const numGivens = this.props.texts.filter(
      (item) => item.reason === "Given"
    ).length;
    return (
      <div className="top-0 left-0 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] mt-4">
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
            <div
              className={
                this.props.ctx.aspect === AspectRatio.Square ? "ml-16" : ""
              }
            >
              <StaticDiagram
                svgIdSuffix={`static-${GIVEN_ID}`}
                ctx={this.props.ctx}
                width={
                  this.props.ctx.aspect === AspectRatio.Landscape
                    ? "400px"
                    : "250px"
                }
                height="auto"
              />
            </div>
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
            <div className="font-bold text-lg text-slate-800">Definitions:</div>
            {this.renderAllDefinitions(numGivens)}
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
