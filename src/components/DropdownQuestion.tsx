import React from "react";
import { QuestionProps, QuestionState } from "./YesNoQuestion";

export type DropdownQuestionProps = {
  hasTextBox: boolean;
} & QuestionProps;

type DropdownQuestionState = {
  isOpen: boolean;
  inputText: string;
} & QuestionState;

export class DropdownQuestion extends React.Component<
  DropdownQuestionProps,
  DropdownQuestionState
> {
  constructor(props: DropdownQuestionProps) {
    super(props);
    this.state = {
      selectedOption: "",
      isOpen: false,
      showHint: false,
      inputText: "",
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
      this.setState({
        selectedOption: newSelect,
      });
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
    if (this.props.hasTextBox && idx === this.props.answers.length - 1) {
      return this.renderTextBox(option);
    }
    return (
      <div
        className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:text-gray-500"
        onClick={() => this.onDropdownClick(option)}
        id={`dropdown-item-${idx}`}
        key={idx}
      >
        {option}
      </div>
    );
  };

  handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    this.setState({ inputText: value });
  };

  renderTextBox = (option: string) => {
    return (
      <div className="py-2">
        <label
          className="text-sm px-4 cursor-pointer text-gray-700 hover:text-gray-500"
          onClick={() => this.onDropdownClick(this.state.inputText)}
        >
          {option}
        </label>
        <textarea
          id="input-group-search"
          className="w-[300px] mx-4 p-2 text-sm text-gray-700 border border-gray-300 rounded-lg bg-gray-50 bg-slate-100"
          placeholder="(120 character limit)"
          maxLength={120}
          value={this.state.inputText}
          onChange={this.handleInputChange}
        />
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
                className="inline-flex w-[270px] justify-between items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={this.toggleDropdown}
              >
                {label || "Choose your answer."}
                <svg
                  className="-mr-1 h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div
                className={`absolute -right-4 z-10 mt-2 w-[340px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                  this.state.isOpen ? "block" : "hidden"
                }`}
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
                className="inline-flex w-[80px] justify-center rounded-md items-center bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 sm:ml-3 disabled:bg-purple-300 disabled:cursor-not-allowed"
                onClick={this.handleSubmit}
                disabled={this.state.selectedOption === ""}
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
