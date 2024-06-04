import React from "react";
import { RadioQuestion } from "./RadioQuestion";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { TextQuestion } from "./TextQuestion";
import { QuestionType } from "../questions/completeQuestions";
import { Question } from "../questions/completeQuestions";

interface QuestionsProps {
  questions: Question[];
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

  render() {
    const currentQuestion =
      this.props.questions[this.state.currentQuestionIndex];
    const answers = currentQuestion.answers || [];

    return (
      <>
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
      </>
    );
  }
}
