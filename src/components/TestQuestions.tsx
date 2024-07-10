import React from "react";
import { AnswerType, Question } from "../questions/funcTypeQuestions";
import { DropdownQuestion } from "./DropdownQuestion";
import { YesNoQuestion } from "./YesNoQuestion";

interface QuestionsProps {
  proofType: string;
  questions: Question[];
  questionIdx: number;
  onSubmit?: () => void;
  questionsCompleted?: () => void;
  onNext: (direction: number) => void;
  onAnswerUpdate: (question: string, answer: string, version: string) => void;
  scaffolding: { [key: string]: boolean };
  updateScaffolding: (questionType: string) => void;
  setActiveQuestionIndex: (index: number) => void;
}

export class TestQuestions extends React.Component<QuestionsProps> {
  constructor(props: QuestionsProps) {
    super(props);
  }

  isFirstOfType = (question: Question) => {
    const questionType = question.type.toString();
    if (!this.props.scaffolding[questionType]) {
      this.props.updateScaffolding(questionType);
      return true;
    }
    return false;
  };

  handleSubmit = (answer: any) => {
    const id = this.props.questions[this.props.questionIdx].id;
    // console.log(
    //   `Answer for question ${this.props.questionIdx + 1}, id: ${id}:`,
    //   answer,
    //   this.props.proofType
    // );

    this.props.onAnswerUpdate(id, answer, this.props.proofType);
    if (this.props.questionIdx < this.props.questions.length - 1) {
      this.props.setActiveQuestionIndex(this.props.questionIdx + 1);
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    } else {
      this.props.onNext(1);
      if (this.props.questionsCompleted) {
        this.props.questionsCompleted();
      }
    }
  };

  render() {
    const currentQuestion = this.props.questions[this.props.questionIdx];
    const answers = currentQuestion.answers;
    return (
      <>
        {/* <div className="flex items-center mb-4">
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
        </div> */}
        <div className="flex">
          <span className="pr-6 self-center">
            Q{this.props.questionIdx + 1}:
          </span>
          {currentQuestion.answerType === AnswerType.YesNo && (
            <YesNoQuestion
              proofType={this.props.proofType}
              questionNum={(this.props.questionIdx + 1).toString()}
              question={currentQuestion.prompt}
              answers={["Yes", "No"]}
              onSubmit={this.handleSubmit}
              type={currentQuestion.type}
              scaffolding={this.props.scaffolding}
              updateScaffolding={this.props.updateScaffolding}
              scaffoldReason={currentQuestion.reason || ""}
            />
          )}
          {currentQuestion.answerType === AnswerType.Dropdown && (
            <DropdownQuestion
              proofType={this.props.proofType}
              question={currentQuestion.prompt}
              questionNum={(this.props.questionIdx + 1).toString()}
              answers={answers || []}
              onSubmit={this.handleSubmit}
              type={currentQuestion.type}
              scaffolding={this.props.scaffolding}
              updateScaffolding={this.props.updateScaffolding}
              scaffoldReason=""
            />
          )}
        </div>
      </>
    );
  }
}
