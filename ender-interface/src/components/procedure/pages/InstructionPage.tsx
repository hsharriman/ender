import React from "react";
import { ContinueButton } from "./ContinueButton";

export interface InstructionPageProps {
  onNext: (direction: number) => void;
}

export class InstructionPage extends React.Component<InstructionPageProps> {
  render() {
    return (
      <div className="w-full flex items-center justify-center flex-col pt-40 font-notoSans text-slate-800 text-xl text-start">
        <div className="max-w-[900px] pb-8 flex flex-col gap-4">
          <div className="text-2xl font-bold pb-4">
            Proof Comprehension Activity (~30 mins)
          </div>
          <div>
            From now on you will continue using the think aloud method as you
            answer questions about 8 proofs. Some of the proofs are correct and
            some have mistakes. We recommend that you read through the proof
            before trying to answer the questions. Let the researcher know if
            you have any questions and remember to keep thinking aloud as you
            work :)
          </div>
        </div>
        <ContinueButton onNext={this.props.onNext} />
      </div>
    );
  }
}
