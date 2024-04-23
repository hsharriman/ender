import React from "react";
import { ProofTextItem, Reason } from "../core/types";
import { ReasonText } from "./ReasonText";
import { StaticDiagram } from "./StaticDiagram";

export interface LongPageProps {
  proofText: ProofTextItem[];
  reliesOn?: Map<string, Set<string>>;
  frames: string[];
  givenSvg: JSX.Element[];
  miniSvgElements: (activeFrame: string) => JSX.Element[];
  reasonText: (activeFrame: string) => Reason;
  svgElements: JSX.Element[][];
}

export class LongPage extends React.Component<LongPageProps> {
  constructor(props: LongPageProps) {
    super(props);
  }

  renderGiven = () => {
    const textStyle =
      "border-gray-200 border-b-2 w-11/12 h-16 ml-2 text-lg grid grid-rows-1 grid-cols-8 content-end py-4";
    const givenText = (
      <div className={textStyle}>
        <div className="col-span-1 font-semibold">Given:</div>
        <div className="col-span-7">{this.props.proofText[0].v}</div>
      </div>
    );
    const proveText = (
      <div className={textStyle}>
        <div className="col-span-1 font-semibold">Prove:</div>
        <div className="col-span-7">{this.props.proofText[1].v}</div>
      </div>
    );
    return (
      <div className="grid grid-rows-1 grid-cols-2 w-screen">
        <StaticDiagram
          width="450px"
          height="300px"
          svgIdSuffix="construction"
          svgElements={this.props.givenSvg}
        />
        <div className="flex flex-col justify-start w-11/12 ml-2">
          {givenText}
          {proveText}
        </div>
      </div>
    );
  };

  renderRow = (item: ProofTextItem, idx: number) => {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    return (
      <div className="flex flex-row justify-start h-16" key={item.k}>
        <button
          id={`proofrow-${item.k}`}
          className="border-gray-200 border-b-2 w-11/12 h-16 ml-2 text-lg"
        >
          <div
            className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-8`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline col-span-4">
              <div className="text-slate-400 font-bold">{idx + 1}</div>
              {item.v}
            </div>
            <div className="flex flex-row justify-start align-baseline col-span-4">
              {item.reason}
            </div>
          </div>
        </button>
      </div>
    );
  };

  renderStep = (frame: string, idx: number) => {
    // diagram takes up 1row and 1 col
    // #
    return (
      <div className="grid grid-rows-1 grid-cols-2 w-screen">
        <div className="m-4">
          <StaticDiagram
            width="450px"
            height="300px"
            svgIdSuffix="construction"
            svgElements={this.props.svgElements[idx]}
          />
        </div>
        <div className="flex flex-col justify-start">
          <div>{this.renderRow(this.props.proofText[idx + 2], idx)}</div>
          <div className="grid grid-rows-1 grid-cols-8 h-48 w-11/12 ml-2">
            <div className="col-span-4 pt-4">
              <StaticDiagram
                width="100%"
                height="100%"
                svgIdSuffix="mini"
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
      <>
        {/* {this.props.reliesOn && (
          <ReliesOn
            reliesOn={this.props.reliesOn}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )} */}
        <div className="w-screen h-screen font-sans text-slate-800 flex flex-col justify-left p-4">
          <div className="flex justify-start ml-4 pb-2 border-b-2 border-gray-300 font-bold my-4 text-2xl">
            Given Information
          </div>
          {this.renderGiven()}
          <div className="w-full mb-16"></div>
          <div className="grid grid-rows-1 grid-cols-2 ml-4 pb-2 border-b-2 border-gray-300 text-lg font-bold mb-4">
            <div className="text-2xl">Proof Steps</div>
            <div className="grid grid-rows-1 grid-cols-8">
              <div className="pl-16">Statement</div>
              <div className="col-start-5">Reason</div>
            </div>
          </div>
          {this.props.frames.map((item, idx) => {
            return this.renderStep(item, idx);
          })}
        </div>
      </>
    );
  }
}
