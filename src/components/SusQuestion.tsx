// RadioQuestion.tsx
import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface susQuestionProps {
  questionNum: string;
  question: string;
  answers: string[];
  selectedOption: string;
  onAnswerChange: (questionNum: string, answer: string) => void;
}

class SusQuestion extends React.Component<susQuestionProps> {
  constructor(props: susQuestionProps) {
    super(props);
  }

  handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { questionNum, onAnswerChange } = this.props;
    onAnswerChange(questionNum, event.target.value);
  };

  render() {
    const { questionNum, question, answers, selectedOption } = this.props;

    return (
      <div className="mb-6">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-base text-slate-500">
            Question {Number(questionNum) + 1}:
          </div>
        </div>
        <div className="font-bold text-base pb-1">{question}</div>
        <div className="text-base flex items-center justify-between">
          <label className="mr-2">Strongly Disagree</label>
          {answers.map((answer, index) => (
            <div className="py-0.5 flex flex-col items-center" key={index}>
              <label>{answer}</label>
              <input
                type="radio"
                value={answer}
                name={question}
                checked={selectedOption === answer}
                onChange={this.handleRadioChange}
              />
            </div>
          ))}
          <label className="ml-2">Strongly Agree</label>
        </div>
      </div>
    );
  }
}

export default SusQuestion;
