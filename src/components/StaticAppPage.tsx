import React from "react";
import { Reason, StaticProofTextItem } from "../core/types";
import { StaticDiagram } from "./StaticDiagram";

export interface StaticAppPageProps {
  reasons: Reason[];
  texts: StaticProofTextItem[];
  diagram: JSX.Element[];
  givenText: JSX.Element;
  proveText: JSX.Element;
}
export class StaticAppPage extends React.Component<StaticAppPageProps> {
  renderRow = (item: StaticProofTextItem, i: number) => {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    return (
      <div className="flex flex-row justify-start h-12">
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
        <div className="flex flex-col justify-start pb-2">
          <div className="font-semibold text-sm">{item.title}</div>
          <div className="text-sm">{item.body}</div>
        </div>
      </>
    );
  };

  render() {
    return (
      <div className="absolute top-0 left-0 flex flex-row flex-nowrap w-[1100px] mt-12">
        <div className="w-[800px] h-full flex flex-col ml-12">
          <div className="flex flex-row">
            <div className="flex flex-col mx-4 w-[300px]">
              <div className="pb-2">
                <div className="font-bold">Given:</div>
                <div>{this.props.givenText}</div>
              </div>
              <div>
                <div className="font-bold">Prove:</div>
                <div>{this.props.proveText}</div>
              </div>
            </div>
            <StaticDiagram
              svgIdSuffix="control"
              svgElements={this.props.diagram}
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
        <div className="w-[300px] flex flex-col justify-start">
          <div className="font-bold text-base text-slate-500 pb-2">
            Reasons Applied:
          </div>
          {this.props.reasons.map((reason) => this.renderReason(reason))}
        </div>
      </div>
    );
  }
}
