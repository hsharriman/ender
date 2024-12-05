import React from "react";
import {
  AnswerType,
  Question,
} from "../../../core/testinfra/questions/testQuestions";
import { ButtonQuestion } from "./ButtonQuestion";
import { DropdownQuestion } from "./DropdownQuestion";

interface QuestionsProps {
  proofType: string;
  questions: Question[];
  questionIdx: number;
  submitEnabled: boolean;
  onNext: (direction: number) => void;
  onAnswerUpdate: (question: string, answer: string, version: string) => void;
  setActiveQuestionIndex: (index: number) => void;
  incrementTutorial?: () => boolean;
}

export class TestQuestions extends React.Component<QuestionsProps> {
  FIRST_CORRECT_Q_ID = "11";
  NUM_CORRECT_FOLLOWUPS = 2;
  handleSubmit = (answer: any) => {
    const question = this.props.questions[this.props.questionIdx];

    this.props.onAnswerUpdate(question.id, answer, this.props.proofType);
    if (question.id.endsWith(this.FIRST_CORRECT_Q_ID) && answer === "No") {
      // special case for "Does this proof have a mistake?"
      // skip next 2 questions if the first answer selected was No
      if (
        this.props.questionIdx + this.NUM_CORRECT_FOLLOWUPS <
        this.props.questions.length - 1
      ) {
        // skip to the next question in the sequence
        this.props.setActiveQuestionIndex(
          this.props.questionIdx + this.NUM_CORRECT_FOLLOWUPS + 1
        );
      } else {
        // move to the next proof
        this.props.onNext(1);
      }
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
        <div className="flex items-center">
          <span className="pr-6">Q{this.props.questionIdx + 1}:</span>
          <div className="font-bold pr-10">{currentQuestion.prompt}</div>
          {(currentQuestion.answerType === AnswerType.YesNo ||
            currentQuestion.answerType === AnswerType.Continue) && (
            <ButtonQuestion
              proofType={this.props.proofType}
              answers={
                currentQuestion.answerType === AnswerType.YesNo
                  ? ["Yes", "No"]
                  : ["Continue"]
              }
              onSubmit={this.handleSubmit}
              type={currentQuestion.type}
              submitEnabled={this.props.submitEnabled}
            />
          )}
          {dropdownAnswerType && (
            <DropdownQuestion
              proofType={this.props.proofType}
              answers={answers || []}
              onSubmit={this.handleSubmit}
              type={currentQuestion.type}
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
