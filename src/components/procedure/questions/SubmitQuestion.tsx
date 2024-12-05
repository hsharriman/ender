import React from "react";

interface SubmitQuestionProps {
  // answerType: string;
  // inputAnswer: string[];
  onClick: () => void;
  disabled: boolean;
}

export class SubmitQuestion extends React.Component<SubmitQuestionProps> {
  constructor(props: SubmitQuestionProps) {
    super(props);
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      this.props.onClick();
    }
  };

  render() {
    return (
      <div className="font-bold text-lg mt-4 mb-4 text-slate-50">
        <button
          onClick={this.props.onClick}
          disabled={this.props.disabled}
          className={`py-1.5 px-2 rounded-md
            ${
              this.props.disabled
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#9459d4] hover:bg-[#7644ad] focus:bg-[#623691]"
            }`}
        >
          Submit
        </button>
      </div>
    );
  }
}
