import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";


interface QuestionProps {
    questionNum: string;
    question: string;
    answers: string[];
}

export class RadioQuestion extends React.Component<QuestionProps> {
  constructor(props: QuestionProps) {
    super(props);
  }

  render() {
    const questionNum = this.props.questionNum
    const question = this.props.question
    const answers = this.props.answers

    return (
      <div className="">
        <div className="flex flex-col justify-start pb-1">
          <div className="font-bold text-base text-slate-500">
            {questionNum}:
          </div>
        </div>
        <div className="font-bold text-base pb-1">
          {question}
        </div>
        <div className="text-base">
        {
          answers.map(answer => {
            return <div className="py-0.5">
              <input type="radio" value={answer} name={question} />
              <label> {answer} </label>
            </div>
          })
        }
        </div>
        <SubmitQuestion />
      </div>
    )
  }
}