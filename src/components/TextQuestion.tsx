import React from "react";
import { QuestionProps } from "./RadioQuestion";
import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionState {
  inputText: string;
}

export class TextQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      inputText: "",
    };
  }

  handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    this.setState({ inputText: value });
  };

  handleSubmit = () => {
    const { inputText } = this.state;
    if (inputText.length === 0) {
      // TODO: add alert for empty input
      return;
    }
    this.props.onSubmit(this.state.inputText);
    this.setState({
      inputText: "",
    });
  };

  render() {
    const { questionNum, question } = this.props;
    const inputText = this.state.inputText;

    return (
      <div className="text-lg">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-boldtext-slate-500">Question {questionNum}:</div>
        </div>
        <div className="font-bold pb-1">{question}</div>
        <div className="text-base">
          <textarea
            name={questionNum}
            className="border-2 border-black w-full p-1.5 rounded-sm"
            value={inputText}
            onChange={this.handleInputChange}
          />
        </div>
        <SubmitQuestion onClick={this.handleSubmit} />
      </div>
    );
  }
}
