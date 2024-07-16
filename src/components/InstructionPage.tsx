import React from "react";
import { logEvent } from "../core/utils";

interface InstructionPageProps {
  onNext: (direction: number) => void;
}

export class InstructionPage extends React.Component<InstructionPageProps> {
  handleContinue = () => {
    logEvent("i", {
      c: "",
      v: "",
    });
    this.props.onNext(1);
  };

  render() {
    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <span>Congratulation, you've finished the tutorial! :)</span>
        <p className="max-w-[900px] text-center">
          <br />
          Now, we will begin the experiment. Remember that this is not a test on
          your abilities to do geometric proofs, we are testing how well our
          tool works.
        </p>
        <br />
        <p className="max-w-[900px] text-center">
          So, please read the proofs and questions carefully and answer to the
          best of your abilities.
        </p>
        <p className="max-w-[900px] text-center">
          And remember to hold the mouse while you're working through the pages.
        </p>
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
