import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionProps {
  questionNum: string;
  question: string;
  answers: string[];
}

interface QuestionState {
  selectedOption: string[];
}

export class RadioQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      selectedOption: [],
    };
    this.handleRadioChange = this.handleRadioChange.bind(this);
  }

  handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.setState({
      selectedOption: [value],
    });
  };

  render() {
    const { questionNum, question, answers } = this.props;
    const selectedOption = this.state.selectedOption;

    return (
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-base text-slate-500">
            {questionNum}:
          </div>
        </div>
        <div className="font-bold text-base pb-1">{question}</div>
        <div className="text-base">
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
        <SubmitQuestion
          answerType="Single Select"
          inputAnswer={this.state.selectedOption}
        />
      </div>
    );
  }
}
