import React from "react";
import {
  AnswerType,
  Question,
  QuestionType,
} from "../questions/funcTypeQuestions";
import { DropdownQuestion } from "./DropdownQuestion";
import { YesNoQuestion } from "./YesNoQuestion";

interface QuestionsProps {
  proofType: string;
  questions: Question[];
  questionIdx: number;
  submitEnabled: boolean;
  onNext: (direction: number) => void;
  onAnswerUpdate: (question: string, answer: string, version: string) => void;
  scaffolding: { [key: string]: boolean };
  updateScaffolding: (questionType: string) => void;
  setActiveQuestionIndex: (index: number) => void;
  incrementTutorial?: () => boolean;
}

export class TestQuestions extends React.Component<QuestionsProps> {
  isFirstOfType = (question: Question) => {
    const questionType = question.type.toString();
    if (!this.props.scaffolding[questionType]) {
      this.props.updateScaffolding(questionType);
      return true;
    }
    return false;
  };

  handleSubmit = (answer: any) => {
    const question = this.props.questions[this.props.questionIdx];
    // console.log(
    //   `Answer for question ${this.props.questionIdx + 1}, id: ${question.id}:`,
    //   answer,
    //   this.props.proofType
    // );

    this.props.onAnswerUpdate(question.id, answer, this.props.proofType);
    if (
      question.type === QuestionType.Correctness &&
      this.props.questionIdx === 0 &&
      question.answerType === AnswerType.YesNo &&
      answer === "No"
    ) {
      // skip subsequent questions if the first answer selected was No in phase 2 questions
      this.props.onNext(1);
    } else if (this.props.questionIdx < this.props.questions.length - 1) {
      // move to the next question
      this.props.setActiveQuestionIndex(this.props.questionIdx + 1);

      // increment step in tutorial
      this.props.incrementTutorial && this.props.incrementTutorial();
    } else {
      // checks if all tutorial questions have been shown, if not, increment tutorial step
      // but do not move to the next proof page
      // if incrementTutorial is not defined, it means it is not a tutorial
      if (this.props.incrementTutorial) {
        const shouldUpdate = this.props.incrementTutorial();
        if (!shouldUpdate) {
          return;
        }
      }
      // move to the next proof
      this.props.onNext(1);
    }
  };

  render() {
    const currentQuestion = this.props.questions[this.props.questionIdx];
    const answers = currentQuestion.answers;
    const dropdownAnswerType =
      currentQuestion.answerType === AnswerType.Dropdown ||
      currentQuestion.answerType === AnswerType.DropdownTextbox;
    return (
      <>
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
              submitEnabled={this.props.submitEnabled}
            />
          )}
          {dropdownAnswerType && (
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
              hasTextBox={
                currentQuestion.answerType === AnswerType.DropdownTextbox
              }
              submitEnabled={this.props.submitEnabled}
            />
          )}
        </div>
      </>
    );
  }
}
