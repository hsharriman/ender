import React from "react";
import { InstructionPageProps } from "./InstructionPage";
import { logEvent } from "../core/utils";

export class IntroExperimentPage extends React.Component<InstructionPageProps> {
  handleContinue = () => {
    logEvent("i", {
      c: "",
      v: "",
    });
    this.props.onNext(1);
  };

  render() {
    const pCls = "max-w-[900px] text-left pb-4";
    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <span className="text-2xl pb-4">
          Thanks for participating in our study today!
        </span>
        <div className={pCls}>
          <span className="font-bold">
            This activity is not a test of your proof-solving ability
          </span>
          , so please do not be nervous! By using this software, you are helping
          our research team to find out if interactivity helps or hurts your
          understanding of geometric proofs.
        </div>
        <br />
        <div className={pCls}>
          You will have 50 minutes to work. Do not worry if you run out of time.
          Just try your best! A researcher will interview you on your experience
          for at most 10 minutes afterwards.
        </div>
        <div className={pCls}>
          You can help the researchers out by holding the mouse while you work
          through the problems so we can tell which parts of the website you
          clicked or hovered on.
        </div>
        <br />
        <button
          onClick={this.handleContinue}
          className="bg-green-500 hover:bg-green-700 text-4xl text-white font-bold py-3 px-5 rounded-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-2">
            <polygon
              strokeWidth={2}
              points="10,5 34,20 10,35"
              className="fill-current text-white"
            />
          </svg>
          Continue
        </button>
      </div>
    );
  }
}
