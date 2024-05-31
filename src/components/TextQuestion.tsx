import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionProps {
  questionNum: string;
  question: string;
}

interface QuestionState {
  inputText: string[];
}

export class TextQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      inputText: [],
    };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    this.setState({ inputText: [value] });
  }

  render() {
    const { questionNum, question } = this.props;
    const inputText = this.state.inputText;

    return (
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-base text-slate-500">
            {questionNum}:
          </div>
        </div>
        <div className="font-bold text-base pb-1">{question}</div>
        <div className="text-base">
          <textarea
            name={question}
            className="border-2 border-black w-full p-1.5 rounded-sm"
            value={inputText}
            onChange={this.handleInputChange}
          />
        </div>
        <SubmitQuestion
          answerType="Text Input"
          inputAnswer={this.state.inputText}
        />
      </div>
    );
  }
}
