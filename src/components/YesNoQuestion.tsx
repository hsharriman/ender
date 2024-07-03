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

  handleButtonClick = (answer: string) => {
    this.props.onSubmit(answer);
    this.setState({ selectedOption: "" });
  };

  handleKeyPress = (event: KeyboardEvent) => {
    const { answers } = this.props;
    const index = parseInt(event.key) - 1;
    if (index >= 0 && index < answers.length) {
      this.setState({ selectedOption: answers[index] }, () => {
        this.props.onSubmit(answers[index]); // Automatically submit when a key is pressed
      });
    }
  };

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }

  render() {
    const { question, answers } = this.props;
    const selectedOption = this.state.selectedOption;

    return (
      <div className="text-xl">
        <div className="flex ">
          {/* <div className="font-bold pr-[300px]">{this.props.fullScaffold}</div> */}
          <div className="font-bold pr-10 pb-1">{question}</div>
          {answers.map((answer, index) => (
            <button
              key={index}
              className={`px-2.5 mr-6 bg-gray-500 hover:bg-violet-500 rounded-md text-slate-100`}
              onClick={() => this.handleButtonClick(answer)}
              id={"answer-button-" + index}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
