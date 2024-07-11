import React from "react";
import { logEvent } from "../core/utils";
import { scaffolding } from "../questions/funcTypeQuestions";

export interface QuestionProps {
  proofType: string;
  questionNum: string;
  question: string | JSX.Element;
  answers: string[];
  onSubmit: (answer: string) => void;
  type: string;
  scaffolding: { [key: string]: boolean };
  updateScaffolding: (questionType: string) => void;
  scaffoldReason: string;
}

export interface QuestionState {
  selectedOption: string;
  showHint: boolean;
}

export class YesNoQuestion extends React.Component<
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
    if (this.props.proofType === "interactive") {
      this.isFirstOfType();
    }
    this.props.onSubmit(answer);
    this.setState({ selectedOption: "" });
  };

  handleKeyPress = (event: KeyboardEvent) => {
    if (this.props.proofType === "interactive") {
      this.isFirstOfType();
    }

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

  isFirstOfType = () => {
    const questionType = this.props.type.toString();
    if (!this.props.scaffolding[questionType]) {
      this.props.updateScaffolding(questionType);
    }
  };

  renderHint = (hint: string) => {
    return <div className="italic text-base font-semibold">{hint}</div>;
  };

  toggleHint = () => {
    this.setState({ showHint: !this.state.showHint });
    logEvent("c", {
      c: "qh",
      v: `${this.state.showHint ? "hide" : "show"}`,
    });
  };

  renderHintBtn = (isOpen: boolean, show: boolean) => {
    return (
      <button
        className={`ml-1 w-4 h-4 rounded-xl text-white text-xs align-top select-none ${
          isOpen ? "bg-slate-300" : "bg-slate-500"
        } ${show ? "opacity-1" : "opacity-0"}`}
        onClick={this.toggleHint}
        id="hint-button"
      >
        ?
      </button>
    );
  };

  renderQuestionPrompt = () => {
    if (this.props.proofType === "static") {
      return <div className="font-bold pr-10 pb-1">{this.props.question}</div>;
    }
    if (!this.props.scaffolding[this.props.type]) {
    }
    const showHint =
      !this.props.scaffolding[this.props.type] || this.state.showHint;
    if (this.props.type === "Minifigures") {
      return (
        <div className="font-bold pr-10 pb-1">
          {this.props.question}
          {this.renderHintBtn(
            showHint,
            this.props.scaffolding[this.props.type]
          )}
          <br />
          {showHint &&
            this.renderHint(scaffolding.mini(this.props.scaffoldReason))}
        </div>
      );
    } else if (this.props.type === "ReliesOn") {
      return (
        <div className="font-bold pr-10 pb-1">
          {this.props.question}
          {this.renderHintBtn(
            showHint,
            this.props.scaffolding[this.props.type]
          )}
          <br />
          {showHint &&
            this.renderHint(scaffolding.relies(this.props.scaffoldReason))}
        </div>
      );
    } else {
      return (
        <div className="font-bold pr-10 pb-1">
          {this.props.question}
          {this.renderHintBtn(
            showHint,
            this.props.scaffolding[this.props.type]
          )}
          <br />
          {showHint && this.renderHint(scaffolding.diagram)}
        </div>
      );
    }
  };

  render() {
    const { question, answers } = this.props;
    const selectedOption = this.state.selectedOption;

    return (
      <div className="text-xl">
        <div className="flex ">
          {this.renderQuestionPrompt()}
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
