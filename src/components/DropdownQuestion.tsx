import React from "react";
import { QuestionProps, QuestionState } from "./YesNoQuestion";

type DropdownQuestionState = {
  isOpen: boolean;
} & QuestionState;

export class DropdownQuestion extends React.Component<
  QuestionProps,
  DropdownQuestionState
> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      selectedOption: "",
      isOpen: false,
      showHint: false,
    };
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.selectedOption);
    this.setState({ selectedOption: "" });
  };

  toggleDropdown = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  onDropdownClick = (newSelect: string) => {
    if (this.state.selectedOption !== newSelect) {
      this.setState({ selectedOption: newSelect });
    }
    this.toggleDropdown();
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

  renderOption = (option: string, idx: number) => {
    return (
      <div
        className="block px-4 py-2 text-sm text-gray-700"
        onClick={() => this.onDropdownClick(option)}
        id={`dropdown-item-${idx}`}
        key={idx}
      >
        {option}
      </div>
    );
  };

  render() {
    const { question, answers } = this.props;
    const selectedOption = this.state.selectedOption;
    const lineWidth = 28;
    const label =
      selectedOption.length > lineWidth
        ? selectedOption.slice(0, lineWidth) + "..."
        : selectedOption;
    return (
      <div className="relative inline-block text-left">
        <div className="flex flex-row justify-between items-center">
          <div className="font-bold pr-10 pb-1">{question}</div>
          <div className="h-[40px] min-w-[430px] grid grid-cols-8">
            <div className="absolute w-[250px]">
              <button
                type="button"
                className="inline-flex w-[270px] justify-between items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                id="menu-button"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={this.toggleDropdown}
              >
                {label || "Choose your answer."}
                <svg
                  className="-mr-1 h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <div
                className={`absolute -right-4 z-10 mt-2 w-[340px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                  this.state.isOpen ? "block" : "hidden"
                }`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabIndex={-1}
              >
                <div className="py-1 divide-y divide-gray-100" role="none">
                  {this.props.answers.map((option, idx) =>
                    this.renderOption(option, idx)
                  )}
                </div>
              </div>
            </div>
            <div className="col-start-6 col-span-2">
              <button
                className="inline-flex w-[80px] justify-center rounded-md items-center bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 sm:ml-3"
                onClick={this.handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
