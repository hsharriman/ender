import React from "react";

export interface QuestionProps {
  proofType: string;
  answers: string[];
  onSubmit: (answer: string) => void;
  type: string;
  scaffolding?: { [key: string]: boolean };
  updateScaffolding?: (questionType: string) => void;
  scaffoldReason?: string;
  submitEnabled: boolean;
}

export interface QuestionState {
  selectedOption: string;
  showHint: boolean;
}

export class ButtonQuestion extends React.Component<
  QuestionProps,
  QuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      selectedOption: "",
      showHint: false,
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
    const { answers } = this.props;

    return (
      <div className="text-md">
        <div className="flex flex-row items-center">
          {answers.map((answer, index) => (
            <button
              key={index}
              className={`px-2 mr-3 bg-gray-500 hover:bg-blue-500 rounded-md text-white py-1 disabled:bg-gray-300`}
              onClick={() => this.handleButtonClick(answer)}
              id={"answer-button-" + index}
              disabled={!this.props.submitEnabled}
            >
              {`${index + 1}: ${answer}`}
            </button>
          ))}
        </div>
      </div>
    );
  }
}
