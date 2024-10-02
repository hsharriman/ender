import React from "react";
import { susQuestions } from "../../../core/testinfra/questions/susQuestions";
import { SubmitQuestion } from "../questions/SubmitQuestion";
import SusQuestion from "../questions/SusQuestion";

interface susPageProps {
  onSubmit: () => void;
  updateAnswers: (question: string, answer: string) => void;
}

interface susPageState {
  answers: { [key: string]: string };
  completed: boolean;
}

export class SusPage extends React.Component<susPageProps, susPageState> {
  constructor(props: susPageProps) {
    super(props);
    this.state = {
      answers: {
        ...susQuestions.reduce((acc, _, index) => {
          acc[index.toString()] = "";
          return acc;
        }, {} as { [key: string]: string }),
      },
      completed: false,
    };
  }

  handleAnswerChange = (questionNum: string, answer: string) => {
    this.setState(
      (prevState) => ({
        answers: {
          ...prevState.answers,
          [questionNum]: answer,
        },
      }),
      () => {
        const allAnswered = Object.values(this.state.answers).every(
          (answer) => answer !== ""
        );
        if (allAnswered) {
          this.setState({
            completed: true,
          });
        } else {
          this.setState({
            completed: false,
          });
        }
      }
    );
  };

  handleSubmit = () => {
    const localAnswers = this.state.answers;
    const allAnswered = Object.values(localAnswers).every(
      (answer) => answer !== ""
    );

    if (!allAnswered) {
      return;
    }

    let toLogAnswers = "";
    Object.keys(localAnswers).forEach((questionNum) => {
      this.props.updateAnswers(questionNum, localAnswers[questionNum]);
      toLogAnswers += `Question ${questionNum}: ${localAnswers[questionNum]},`;
    });

    // console.log(
    //   `${this.props.type},SUS,` + toLogAnswers + `,time: ${Date.now()}`
    // );
    this.props.onSubmit();
  };

  render() {
    return (
      <>
        <div className="grid grid-rows-[auto,1fr] gap-2 justify-center w-full min-w-[1300px]">
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center mt-8">
              Interface Usability Questions
            </h2>
            <div className="flex flex-col justify-center w-[700px]">
              <div className="pb-4 text-lg">
                You've completed all the geometry questions! Please answer the
                following questions based on your experience with the interface.
              </div>
              <div className="justify-start">
                <div className="right-column">
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
                </div>
                <div>
                  <SubmitQuestion
                    disabled={!this.state.completed}
                    onClick={this.handleSubmit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
