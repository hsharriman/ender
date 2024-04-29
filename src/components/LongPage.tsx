import React, { createRef, useEffect, useRef } from "react";
import { ProofTextItem, Reason } from "../core/types";
import { ReasonText } from "./ReasonText";
import { StaticDiagram } from "./StaticDiagram";
import { LongFormReliesOn } from "./LongFormReliesOn";
import { LongProofRow } from "./LongProofRow";

export interface LongPageProps {
  proofText: ProofTextItem[];
  reliesOn?: Map<string, string[]>;
  frames: string[];
  givenSvg: JSX.Element[];
  miniSvgElements: (activeFrame: string) => JSX.Element[];
  reasonText: (activeFrame: string) => Reason;
  svgElements: JSX.Element[][];
}

export class LongPage extends React.Component<LongPageProps> {
  private contentWidth = "w-[1200px] min-w-[1200px] ";
  private svgHeight = "250px";
  private svgWidth = "450px";
  private miniSvgHeight = "150px";
  constructor(props: LongPageProps) {
    super(props);
  }

  renderGiven = () => {
    const textStyle =
      "border-gray-200 border-b-2 w-11/12 h-16 ml-2 text-lg grid grid-rows-1 grid-cols-8 content-end py-4";
    const givenText = (
      <div className={textStyle}>
        <div className="col-span-1 font-bold">Given:</div>
        <div className="col-span-7">{this.props.proofText[0].v}</div>
      </div>
    );
    const proveText = (
      <div className={textStyle}>
        <div className="col-span-1 font-bold">Prove:</div>
        <div className="col-span-7">{this.props.proofText[1].v}</div>
      </div>
    );
    return (
      <div className={`grid grid-rows-1 grid-cols-2 ${this.contentWidth}`}>
        <div className="flex justify-end">
          <StaticDiagram
            width="500px"
            height="350px"
            svgIdSuffix="construction"
            svgElements={this.props.givenSvg}
          />
        </div>
        <div className="flex flex-col justify-start w-11/12 ml-2">
          {givenText}
          {proveText}
        </div>
      </div>
    );
  };

  renderRow = (item: ProofTextItem, idx: number) => {
    const reliesOn = this.props.reliesOn;
    if (reliesOn) {
      return <LongProofRow idx={idx} item={item} reliesOn={reliesOn} />;
    }
    return <></>;
  };

  renderStep = (frame: string, idx: number) => {
    // diagram takes up 1row and 1 col
    // #
    return (
      <div className={`grid grid-rows-1 grid-cols-8 ${this.contentWidth}`}>
        <div className="m-4 col-span-3">
          <StaticDiagram
            width={this.svgWidth}
            height={this.svgHeight}
            svgIdSuffix={`construction-${idx}`}
            svgElements={this.props.svgElements[idx]}
          />
        </div>
        <div className="flex flex-col justify-start col-span-5">
          <div>{this.renderRow(this.props.proofText[idx + 2], idx)}</div>
          <div className="grid grid-rows-1 grid-cols-8 h-48 w-11/12 ml-2">
            <div className="col-span-4 pt-4 flex justify-end">
              <StaticDiagram
                width="100%"
                height={this.miniSvgHeight}
                svgIdSuffix={`mini-${idx}`}
                svgElements={this.props.miniSvgElements(frame)}
              />
            </div>
            <div className="col-span-4">
              <ReasonText
                activeFrame={frame}
                textFn={this.props.reasonText}
                displayHeader={false}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // TODO click away handler that displays the initial construction
  render() {
    // TODO render method is not taking an order of frames from props and it should
    return (
      <div className="absolute top-0 left-0 w-full h-screen">
        <div
          className={`${this.contentWidth} h-screen font-notoSans text-slate-800 flex flex-col justify-start p-4`}
        >
          <div className="flex justify-start pb-2 pl-4 ml-4 pt-8 border-b-2 border-gray-300 font-bold my-4 text-2xl">
            Given Information
          </div>
          {this.renderGiven()}
          <div className={`${this.contentWidth} mb-16`}></div>
          <div className="grid grid-rows-1 grid-cols-8 pb-2 ml-4 pl-4 border-b-2 border-gray-300 text-lg font-bold mb-4">
            <div className="text-2xl">Proof Steps</div>
            <div className="grid grid-rows-1 grid-cols-8 col-start-4 col-span-5">
              <div className="pl-12">Statement</div>
              <div className="col-start-5 -m-2">Reason</div>
            </div>
          </div>
          {this.props.frames.map((item, idx) => {
            return this.renderStep(item, idx);
          })}
        </div>
      </div>
    );
  }
}
