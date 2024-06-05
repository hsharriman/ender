import React from "react";
import { Question } from "../questions/completeQuestions";
import { susQuestions } from "../questions/susQuestions";
import SusQuestion from "./SusQuestion";
import { SubmitQuestion } from "./SubmitQuestion";

interface susPageState {
  answers: { [key: string]: string };
}

export class SusPage extends React.Component<{}, susPageState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      answers: susQuestions.reduce((acc, _, index) => {
        acc[index.toString()] = "";
        return acc;
      }, {} as { [key: string]: string }),
    };

    console.log(this.state.answers["1"]);
  }

  handleAnswerChange = (questionNum: string, answer: string) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [questionNum]: answer,
      },
    }));
  };

  handleSubmit = () => {
    const { answers } = this.state;
    const allAnswered = Object.values(answers).every((answer) => answer !== "");

    console.log("Survey results:", answers);
    if (!allAnswered) {
      alert("Please answer all questions.");
      return;
    }

    alert("Survey submitted successfully!");
  };

  render() {
    return (
      <>
        <div className="app-container">
          {susQuestions.map((question, index) => (
            <SusQuestion
              key={index}
              questionNum={index.toString()}
              question={question.prompt}
              answers={question.answers || []}
              selectedOption={this.state.answers[index.toString()]}
              onAnswerChange={this.handleAnswerChange}
            />
          ))}
          <SubmitQuestion onClick={this.handleSubmit} />
        </div>
      </>
    );
  }
}
