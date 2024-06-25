import React from "react";

export interface QuestionProps {
  questionNum: string;
  question: string | JSX.Element;
  answers: string[];
  onSubmit: (answer: string) => void;
}

export interface QuestionState {
  selectedOption: string;
}

export class YesNoQuestion extends React.Component<
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
    this.setState(
      {
        selectedOption: value,
      },
      () => {
        this.handleSubmit();
      }
    );
  };

  handleKeyPress = (event: KeyboardEvent) => {
    const { answers } = this.props;
    const index = parseInt(event.key) - 1;
    if (index >= 0 && index < answers.length) {
      this.setState({ selectedOption: answers[index] }, () => {
        this.handleSubmit();
      });
    }
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }

  handleSubmit = () => {
    const { selectedOption } = this.state;
    if (selectedOption.length === 0) {
      // TODO: add alert for empty input
      return;
    }
    this.props.onSubmit(this.state.selectedOption);
    this.setState({
      selectedOption: "",
    });
  };

  render() {
    const { question, answers } = this.props;
    const selectedOption = this.state.selectedOption;

    return (
      <div className="text-2xl">
        <div className="flex">
          <div className="font-bold pb-1 pr-10">{question}</div>
          {answers.map((answer, index) => {
            return (
              <div className="py-0.5 mr-6" key={index}>
                <input
                  type="radio"
                  value={answer}
                  name={answer}
                  checked={selectedOption === answer}
                  onChange={this.handleRadioChange}
                  className="mr-1"
                />
                <label> {answer} </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
