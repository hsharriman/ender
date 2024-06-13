import React from "react";

interface SubmitQuestionProps {
  // answerType: string;
  // inputAnswer: string[];
  onClick: () => void;
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
          className="bg-[#9459d4] hover:bg-[#7644ad] focus:bg-[#623691] py-1.5 px-2 rounded-md"
        >
          Submit
        </button>
      </div>
    );
  }
}
