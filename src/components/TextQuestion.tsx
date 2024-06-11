import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionProps {
  questionNum: string;
  question: string;
  onSubmit: (text: string) => void;
}

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
      alert("Please type something.");
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
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-lg text-slate-500">
            Question {questionNum}:
          </div>
        </div>
        <div className="font-bold text-lg pb-1">{question}</div>
        <div className="text-base">
          <textarea
            name={question}
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
