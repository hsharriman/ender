import React from "react";
import { logEvent } from "../../../core/testinfra/testUtils";
import { InstructionPageProps } from "./InstructionPage";

export class IntroExperimentPage extends React.Component<InstructionPageProps> {
  handleContinue = () => {
    logEvent("n", {
      c: "i",
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
          , so please do not be nervous!
        </div>
        <div className={pCls}>
          We have 1 hour today, which we will divide as follows:
          <ul className="ml-4">
            <li>(10 mins) Background Questions and Pretest</li>
            <li>(5 mins) Tutorial</li>
            <li>(30 mins) Think-Aloud Activity</li>
            <li>(5 mins) Post-Activity Survey</li>
            <li>(10 mins) Interview</li>
          </ul>
          Do not worry if the researcher asks you to move onto the next task or
          you don't have time to finish. Just try your best and let the
          researcher know if you have any questions.
        </div>
        <div className={pCls}>
          Before we proceed to the main procedure, we will ask you some
          questions about geometry concepts. Click the green button when you're
          ready to get started.
        </div>
        <br />
        <button
          onClick={this.handleContinue}
          className="bg-green-500 hover:bg-green-700 text-2xl text-white font-bold py-2 pl-2 pr-3 rounded-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-7 mr-2">
            <polygon
              strokeWidth={2}
              points="10,8 26,18 10,28"
              className="fill-current text-white"
            />
          </svg>
          Continue
        </button>
      </div>
    );
  }
}
