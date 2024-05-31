import React from "react";

import { SubmitQuestion } from "./SubmitQuestion";

interface QuestionProps {
  questionNum: string;
  question: string;
  answers: string[];
}

interface QuestionState {
  selectedOptions: string[];
}

export class MultiSelectQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      selectedOptions: [],
    };
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }

  handleOptionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { selectedOptions } = this.state;
    const value = event.target.value;

    let newSelectedOptions: string[];

    const optionIndex = selectedOptions.indexOf(value);
    if (optionIndex > -1) {
      // Remove the option if it's already selected
      newSelectedOptions = selectedOptions.filter((option) => option !== value);
    } else {
      // Add the option if it's not selected
      newSelectedOptions = [...selectedOptions, value];
    }

    this.setState({ selectedOptions: newSelectedOptions });
  }

  render() {
    const { questionNum, question, answers } = this.props;
    const selectedOptions = this.state.selectedOptions;

    return (
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-base text-slate-500">
            {questionNum}:
          </div>
        </div>
        <div className="font-bold text-base pb-1">{question}</div>
        <div className="text-base">
          {answers.map((answer) => {
            return (
              <div className="py-0.5">
                <input
                  type="checkbox"
                  value={answer}
                  name={answer}
                  checked={selectedOptions.indexOf(answer) > -1}
                  onChange={this.handleOptionChange}
                />
                <label> {answer} </label>
              </div>
            );
          })}
        </div>
        <SubmitQuestion
          answerType="Multi Select"
          inputAnswer={this.state.selectedOptions}
        />
      </div>
    );
  }
}
