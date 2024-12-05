import React from "react";

interface SubmitButtonProps {
  // answerType: string;
  // inputAnswer: string[];
  onClick: () => void;
  disabled: boolean;
}

export class SubmitButton extends React.Component<SubmitButtonProps> {
  constructor(props: SubmitButtonProps) {
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
                : "bg-blue-500 hover:bg-blue-300 focus:bg-blue-600"
            }`}
        >
          Submit
        </button>
      </div>
    );
  }
}
