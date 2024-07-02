import React from "react";
import { Question } from "../questions/funcTypeQuestions";
import { YesNoQuestion } from "./YesNoQuestion";

interface QuestionsProps {
  proofType: string;
  questions: Question[];
  onSubmit?: () => void;
  questionsCompleted?: () => void;
  onNext: (direction: number) => void;
  onAnswerUpdate: (question: string, answer: string) => void;
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
    const currentQuestionIndex = this.state.currentQuestionIndex;
    this.props.onAnswerUpdate(` Q${currentQuestionIndex + 1}`, answer);
    if (this.state.currentQuestionIndex < this.props.questions.length - 1) {
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
        <div className="flex text-xl">
          <span className="pr-6">Q{this.state.currentQuestionIndex + 1}:</span>
          <YesNoQuestion
            questionNum={(this.state.currentQuestionIndex + 1).toString()}
            fullScaffold={currentQuestion.fullScaffold}
            question={currentQuestion.prompt}
            answers={answers}
            onSubmit={this.handleSubmit}
          />
        </div>
      </>
    );
  }
}
