import React from "react";
import { logEvent } from "../../../core/testinfra/testUtils";

export interface InstructionPageProps {
  onNext: (direction: number) => void;
}

export class InstructionPage extends React.Component<InstructionPageProps> {
  handleContinue = () => {
    logEvent("n", {
      c: "i",
      v: "",
    });
    this.props.onNext(1);
  };

  render() {
    return (
      <div className="w-full flex items-center justify-center flex-col pt-40 font-notoSans text-slate-800 text-xl text-start">
        <div className="max-w-[900px] pb-8 flex flex-col gap-4">
          <div>
            Now, we will begin the next phase of the experiment. Remember that
            this is not a test on your abilities to do geometric proofs; you are
            helping us test how well our tool works.
          </div>
          <div>
            From now on you will continue using the think aloud method as you
            answer questions about a series of proofs. Some of the proofs are
            correct and some have mistakes. We recommend that you read through
            the proof before trying to answer the questions. Let the researcher
            know if you have any questions.
          </div>
        </div>
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
