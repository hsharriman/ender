import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionProps {
  questionNum: string;
  question: string;
  answers: string[];
  onSubmit: (answer: string) => void;
}

interface QuestionState {
  selectedOption: string;
}

export class RadioQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      selectedOption: "",
    };
  }

  handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.setState({
      selectedOption: value,
    });
  };

  handleSubmit = () => {
    const { selectedOption } = this.state;
    if (selectedOption.length === 0) {
      alert("Please select an answer.");
      return;
    }
    this.props.onSubmit(this.state.selectedOption);
    this.setState({
      selectedOption: "",
    });
  };

  render() {
    const { questionNum, question, answers } = this.props;
    const selectedOption = this.state.selectedOption;

    return (
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-lg text-slate-500">
            Question {questionNum}:
          </div>
        </div>
        <div className="font-bold text-lg pb-1">{question}</div>
        <div className="text-lg">
          {answers.map((answer, index) => {
            return (
              <div className="py-0.5" key={index}>
                <input
                  type="radio"
                  value={answer}
                  name={answer}
                  checked={selectedOption.indexOf(answer) > -1}
                  onChange={this.handleRadioChange}
                />
                <label> {answer} </label>
              </div>
            );
          })}
        </div>
        <SubmitQuestion onClick={this.handleSubmit} />
      </div>
    );
  }
}
