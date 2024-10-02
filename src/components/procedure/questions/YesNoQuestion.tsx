import React from "react";
import {
  QuestionType,
  scaffolding,
} from "../../../core/testinfra/questions/funcTypeQuestions";
import { logEvent } from "../../../core/testinfra/testUtils";

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
  submitEnabled: boolean;
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
    return <div className="italic text-sm font-semibold">{hint}</div>;
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
          isOpen ? "bg-slate-300" : "bg-blue-500"
        } ${show ? "opacity-1" : "opacity-0"}`}
        onClick={this.toggleHint}
        id="hint-button"
      >
        ?
      </button>
    );
  };

  renderQuestionPrompt = () => {
    if (
      this.props.proofType === "static" ||
      this.props.type === QuestionType.Correctness
    ) {
      return <div className="font-bold pr-10 pb-1">{this.props.question}</div>;
    }
    const showHint =
      !this.props.scaffolding[this.props.type] || this.state.showHint;
    if (this.props.type === QuestionType.Minifigures) {
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
    } else if (this.props.type === QuestionType.ReliesOn) {
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
    const { answers } = this.props;

    return (
      <div className="text-xl">
        <div className="flex ">
          {this.renderQuestionPrompt()}
          <div className="flex flex-row self-center">
            {answers.map((answer, index) => (
              <button
                key={index}
                className={`px-2.5 mr-6 bg-gray-500 hover:bg-violet-500 rounded-md text-slate-100 h-8 disabled:bg-gray-300`}
                onClick={() => this.handleButtonClick(answer)}
                id={"answer-button-" + index}
                disabled={!this.props.submitEnabled}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
