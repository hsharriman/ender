import React from "react";
import { ContinueButton } from "./ContinueButton";
import { InstructionPageProps } from "./InstructionPage";

export class IntroExperimentPage extends React.Component<InstructionPageProps> {
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
          <div className="ml-6 pb-4">
            <ul className="ml-4 list-decimal">
              <li>(10 mins) Background Questions and Pretest</li>
              <li>(5 mins) Tutorial</li>
              <li>(30 mins) Think-Aloud Activity</li>
              <li>(5 mins) Post-Activity Survey</li>
              <li>(10 mins) Interview</li>
            </ul>
          </div>
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
        <ContinueButton onNext={this.props.onNext} />
      </div>
    );
  }
}
