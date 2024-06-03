import React from "react";
import { ProofRows } from "./ProofRows";
import { ProofTextItem, Reason } from "../core/types";
import { Diagram } from "./Diagram";
import { ReasonText } from "./ReasonText";
import { ReliesOn } from "./ReliesOn";
import { RadioQuestion } from "./RadioQuestion";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { TextQuestion } from "./TextQuestion";
import { completeProof1 } from "../questions/completeQuestions";
import { QuestionType } from "../questions/completeQuestions";
import { Question } from "../questions/completeQuestions";

export interface AppPageProps {
  proofText: ProofTextItem[];
  reliesOn?: Map<string, Set<string>>;
  miniSvgElements: (activeFrame: string) => JSX.Element[];
  reasonText: (activeFrame: string) => Reason;
  svgElements: (activeFrame: string) => JSX.Element[];
  onClickCanvas: () => void;
  questions: Question[];
}

interface AppPageState {
  activeFrame: string;
  currentQuestionIndex: number;
}
export class AppPage extends React.Component<AppPageProps, AppPageState> {
  constructor(props: AppPageProps) {
    super(props);
    this.state = {
      activeFrame: "given",
      currentQuestionIndex: 0,
    };
  }

  handleClick = (active: string) => {
    if (active !== this.state.activeFrame) {
      this.setState({
        activeFrame: active,
      });
    }
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
      alert("Survey completed!");
    }
  };

  // TODO click away handler that displays the initial construction
  render() {
    const currentQuestion =
      this.props.questions[this.state.currentQuestionIndex];
    const answers = currentQuestion.answers || [];
    return (
      <>
        {this.props.reliesOn && (
          <ReliesOn
            reliesOn={this.props.reliesOn}
            activeFrame={this.state.activeFrame}
            rowHeight={64}
          />
        )}
        <div className="top-0 left-0 w-screen max-w-[1400px] min-w-[1300px] xl:justify-start h-full font-notoSans text-slate-800 grid grid-rows-1 grid-cols-2 pt-4 pl-4 gap-4">
          <div id="proof-steps" className="col-start-1">
            <div className="pt-16">
              <ProofRows
                items={this.props.proofText}
                active={this.state.activeFrame}
                onClick={this.handleClick}
              />
            </div>
            {/* <div>{this.props.reliesOn && new component}</div> */}
          </div>
          <div id="canvas-container" className="col-start-2 row-span-5 ml-4">
            <Diagram
              width="100%"
              height="320px"
              svgIdSuffix="construction"
              activeFrame={this.state.activeFrame}
              svgElements={this.props.svgElements}
            />
            <div className="grid grid-rows-1 grid-cols-8 h-44 mt-6">
              <div className="col-span-3">
                <Diagram
                  width="100%"
                  height="100%"
                  svgIdSuffix="mini"
                  activeFrame={this.state.activeFrame}
                  svgElements={this.props.miniSvgElements}
                />
              </div>
              <div className="col-span-5">
                <ReasonText
                  activeFrame={this.state.activeFrame}
                  textFn={this.props.reasonText}
                  displayHeader={true}
                />
              </div>
            </div>
            <div className="col-span-5 pl-6">
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
              {/* <RadioQuestion
                questionNum="Question 1"
                question="Do you agree that segment AC = BD?"
                answers={["Yes", "No", "Can't Tell"]}
              />
              <MultiSelectQuestion
                questionNum="Question 1"
                question="Besides the given information, which statements can be directly applied without any explanation? Select all that apply."
                answers={[
                  "Statement 3",
                  "Statement 4",
                  "Statement 5",
                  "Statement 6",
                  "Statement 7",
                ]}
              />
              <TextQuestion
                questionNum="Question 1"
                question="Explain it as you would to a classmate who has not seen this proof yet.
                For instance: 'Given _______, we first determine _______ in order to conclude that  _______.'"
              /> */}
            </div>
          </div>
        </div>
      </>
    );
  }
}
