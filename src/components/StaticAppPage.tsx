import React from "react";
import { Reason, StaticProofTextItem } from "../core/types";
import { StaticDiagram } from "./StaticDiagram";
import { RadioQuestion } from "./RadioQuestion";
import { TextQuestion } from "./TextQuestion";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { completeProof1 } from "../questions/completeQuestions";
import { QuestionType } from "../questions/completeQuestions";
import { Question } from "../questions/completeQuestions";

export interface StaticAppPageProps {
  reasons: Reason[];
  texts: StaticProofTextItem[];
  diagram: JSX.Element[];
  givenText: JSX.Element;
  proveText: JSX.Element;
  questions: Question[];
}

interface StaticAppPageState {
  currentQuestionIndex: number;
}

export class StaticAppPage extends React.Component<
  StaticAppPageProps,
  StaticAppPageState
> {
  constructor(props: StaticAppPageProps) {
    super(props);
    this.state = {
      currentQuestionIndex: 0,
    };
  }

  renderRow = (item: StaticProofTextItem, i: number) => {
    const textColor = "text-slate-800";
    const strokeColor = "border-slate-800";
    return (
      <div className="flex flex-row justify-start h-12">
        <div
          id={`proof-row-control-${i}`}
          className="border-gray-300 w-10/12 h-12 ml-2 text-normal"
        >
          <div
            className={`${textColor} ${strokeColor} grid grid-rows-1 grid-cols-2 pt-2`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="text-slate-400 font-bold">{i + 1}</div>
              {item.stmt}
            </div>
            <div className="flex flex-row justify-start align-baseline">
              {item.reason}
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderReason = (item: Reason) => {
    return (
      <>
        <div className="flex flex-col justify-start pb-2">
          <div className="font-semibold text-sm">{item.title}</div>
          <div className="text-sm">{item.body}</div>
        </div>
      </>
    );
  };

  handleQuestionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      currentQuestionIndex: Number(event.target.value),
    });
  };

  handleSubmit = (answer: any) => {
    console.log(
      `Answer for question ${this.state.currentQuestionIndex + 1}:`,
      answer
    );
    if (this.state.currentQuestionIndex < this.props.questions.length - 1) {
      this.setState((prevState) => ({
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
      }));
    } else {
      console.log("Survey completed!");
    }
  };

  render() {
    const currentQuestion =
      this.props.questions[this.state.currentQuestionIndex];
    const answers = currentQuestion.answers || [];

    return (
      <div className="top-0 left-0 flex flex-row flex-nowrap w-5/6 mt-12">
        <div className="w-[800px] h-full flex flex-col ml-12">
          <div className="flex flex-row">
            <div className="flex flex-col mx-4 w-[300px]">
              <div className="pb-2">
                <div className="font-bold">Given:</div>
                <div>{this.props.givenText}</div>
              </div>
              <div>
                <div className="font-bold">Prove:</div>
                <div>{this.props.proveText}</div>
              </div>
            </div>
            <StaticDiagram
              svgIdSuffix="control"
              svgElements={this.props.diagram}
              width="400px"
              height="275px"
            />
          </div>
          <div className="py-4 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-normal font-semibold text-slate-500 ml-2 mb-2 w-10/12">
            <div className="flex flex-row justify-start gap-4 align-baseline">
              <div className="opacity-0 pr-4">0</div>
              <div>Statement</div>
            </div>
            <div>Reason</div>
          </div>
          {this.props.texts.map((item, i) => this.renderRow(item, i))}
        </div>
        <div>
          <div className="w-4/6 flex flex-col justify-start">
            <div className="font-bold text-base text-slate-500 pb-2">
              Reasons Applied:
            </div>
            {this.props.reasons.map((reason) => this.renderReason(reason))}
          </div>
          <div className="mt-10">
            <div className="flex items-center mb-4">
              <select
                onChange={this.handleQuestionChange}
                value={this.state.currentQuestionIndex}
                className="border p-2 rounded"
              >
                {this.props.questions.map((q, index) => (
                  <option key={index} value={index}>
                    Question {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              {currentQuestion.type === QuestionType.Single && (
                <RadioQuestion
                  questionNum={(this.state.currentQuestionIndex + 1).toString()}
                  question={currentQuestion.prompt}
                  answers={answers}
                  onSubmit={this.handleSubmit}
                />
              )}
              {currentQuestion.type === QuestionType.Mutli && (
                <MultiSelectQuestion
                  questionNum={(this.state.currentQuestionIndex + 1).toString()}
                  question={currentQuestion.prompt}
                  answers={answers}
                  onSubmit={this.handleSubmit}
                />
              )}
              {currentQuestion.type === QuestionType.Text && (
                <TextQuestion
                  questionNum={(this.state.currentQuestionIndex + 1).toString()}
                  question={currentQuestion.prompt}
                  onSubmit={this.handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
