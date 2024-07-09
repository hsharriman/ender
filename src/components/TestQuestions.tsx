import React from "react";
import {
  QuestionType,
  AnswerType,
  Question,
} from "../questions/funcTypeQuestions";
import { DropdownQuestion } from "./DropdownQuestion";
import { YesNoQuestion } from "./YesNoQuestion";

interface QuestionsProps {
  proofType: string;
  questions: Question[];
  onSubmit?: () => void;
  questionsCompleted?: () => void;
  onNext: (direction: number) => void;
  onAnswerUpdate: (question: string, answer: string) => void;
  scaffolding: { [key: string]: boolean };
  updateScaffolding: (questionType: string) => void;
}

interface QuestionsState {
  currentQuestionIndex: number;
}

export class TestQuestions extends React.Component<
  QuestionsProps,
  QuestionsState
> {
  constructor(props: QuestionsProps) {
    super(props);
    this.state = {
      currentQuestionIndex: 0,
    };
  }

  handleQuestionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({
      currentQuestionIndex: Number(event.target.value),
    });
  };

  isFirstOfType = (question: Question) => {
    const questionType = question.type.toString();
    console.log(this.props.scaffolding);
    if (!this.props.scaffolding[questionType]) {
      this.props.updateScaffolding(questionType);
      return true;
    }
    return false;
  };

  handleSubmit = (answer: any) => {
    const currIdx = this.state.currentQuestionIndex;
    const id = this.props.questions[currIdx].id;
    console.log(`Answer for question ${currIdx + 1}, id: ${id}:`, answer);

    this.props.onAnswerUpdate(id, answer);
    if (currIdx < this.props.questions.length - 1) {
      this.setState((prevState) => ({
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
      }));
      if (this.props.onSubmit) {
        this.props.onSubmit();
      }
    } else {
      this.props.onNext(1);
      this.setState({
        currentQuestionIndex: 0,
      });
      if (this.props.questionsCompleted) {
        this.props.questionsCompleted();
      }
    }
  };

  render() {
    const currentQuestion =
      this.props.questions[this.state.currentQuestionIndex];
    const answers = currentQuestion.answers;
    //console.log(this.props.scaffolding[currentQuestion.type.toString()]);
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
          <span className="pr-6">Q{this.state.currentQuestionIndex + 1}:</span>
          {currentQuestion.answerType === AnswerType.YesNo && (
            <YesNoQuestion
              proofType={this.props.proofType}
              questionNum={(this.state.currentQuestionIndex + 1).toString()}
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
              questionNum={(this.state.currentQuestionIndex + 1).toString()}
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
