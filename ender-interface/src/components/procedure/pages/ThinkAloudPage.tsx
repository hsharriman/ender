import React from "react";
import { ContinueButton } from "./ContinueButton";
import { InstructionPageProps } from "./InstructionPage";

export class ThinkAloudPage extends React.Component<InstructionPageProps> {
  render() {
    const pCls = "max-w-[900px] text-left pb-4";
    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <span className="text-2xl pb-4 font-bold">Think-Aloud Guidelines</span>
        <div className={pCls}>
          This is a method to vocalize your inner thought processes.
        </div>
        <div className={pCls}>
          <ul className="ml-4 list-disc">
            <li>
              Try to say everything that comes to your mind as you complete the
              tasks.
            </li>
            <li>Speak all thoughts, even if they are unrelated to the task</li>
            <li>Refrain from explaining the thoughts</li>
            <li>Try to not plan out what to say</li>
            <li>Imagine that you’re alone and speaking to yourself</li>
            <li>Try to speak continuously</li>
          </ul>
        </div>
        <br />
        <ContinueButton onNext={this.props.onNext} />
      </div>
    );
  }
}
