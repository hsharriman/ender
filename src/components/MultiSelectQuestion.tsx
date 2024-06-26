import React from "react";
import { QuestionProps } from "./RadioQuestion";
import { SubmitQuestion } from "./SubmitQuestion";

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
  }

  handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  handleSubmit = () => {
    const { selectedOptions } = this.state;
    if (selectedOptions.length === 0) {
      // TODO: add alert for empty input
      return;
    }
    this.props.onSubmit(this.state.selectedOptions.join(", "));
    this.setState({
      selectedOptions: [],
    });
  };

  render() {
    const { questionNum, question, answers } = this.props;
    const selectedOptions = this.state.selectedOptions;

    return (
      <div className="text-lg">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-slate-500">
            Question {questionNum}:
          </div>
        </div>
        <div className="font-bold pb-1">{question}</div>
        <div>
          {answers.map((answer, index) => {
            return (
              <div className="py-0.5" key={index}>
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
        {/* <SubmitQuestion onClick={this.handleSubmit} /> */}
      </div>
    );
  }
}
