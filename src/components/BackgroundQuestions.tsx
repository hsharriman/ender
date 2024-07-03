import React from "react";
import { SubmitQuestion } from "./SubmitQuestion";

interface BackgroundQuestionType {
  prompt: string;
}

interface BackgroundPageProps {
  updateAnswers: (question: string, answer: string) => void;
}

interface BackgroundPageState {
  questions: BackgroundQuestionType[];
  answers: { [key: string]: string };
  completed: boolean;
  submitted: boolean;
}

export class BackgroundQuestions extends React.Component<
  BackgroundPageProps,
  BackgroundPageState
> {
  constructor(props: BackgroundPageProps) {
    super(props);
    this.state = {
      questions: [
        {
          prompt: "How old are you?",
        },
        {
          prompt: "What year did you take geometry?",
        },
        {
          prompt: "What grade will you be in September 2024?",
        },
      ],
      answers: {},
      completed: false,
      submitted: false,
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
        const allAnswered = this.state.questions.every(
          (_, index) =>
            this.state.answers[`${index}`] &&
            this.state.answers[`${index}`].trim() !== ""
        );
        this.setState({ completed: allAnswered });
      }
    );
  };

  handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = event.target;
    this.handleAnswerChange(`${index}`, value);
  };

  handleSubmit = () => {
    if (this.state.completed) {
      let localAnswers = this.state.answers;
      Object.keys(localAnswers).forEach((questionNum) => {
        this.props.updateAnswers(questionNum, localAnswers[questionNum]);
      });
      console.log("Survey results:", this.state.answers);
      this.setState({ submitted: true });
    }
  };

  render() {
    return (
      <>
        {this.state.submitted ? (
          <div className="justify-center flex w-full min-w-[1300px] pt-20">
            <span>
              <h2>
                You've completed all the questions for this page, please move to
                the next page!
              </h2>
            </span>
          </div>
        ) : (
          <div className="justify-center flex w-full">
            <div className="mb-8 text-center mt-8 font-notoSans">
              <h2 className="text-2xl font-bold mb-8">Background Questions</h2>
              <div className="mb-8 w-[1000px]">
                <span>
                  Thank you for participating in our study. Your input is
                  important and will contribute to our understanding of how
                  students like you use different ways to read and solve math
                  problems about geometric proofs on computers. We’re also
                  seeing if making these problems interactive helps you
                  understand them better.
                  <br />
                  <br />
                  Before we begin with the main questions, we would like to ask
                  you a few background questions. Your responses will be kept
                  confidential and will only be used for research purposes.
                </span>
              </div>
              {this.state.questions.map((question, index) => (
                <div key={index} className="mb-6">
                  <div className="flex flex-col justify-start pb-1">
                    <div className="font-bold text-base text-slate-500">
                      Question {index + 1}:
                    </div>
                  </div>
                  <div className="font-bold text-base pb-1">
                    {question.prompt}
                  </div>
                  <div className="text-base">
                    <input
                      type="text"
                      name={question.prompt}
                      className="border-2 border-black w-[100px] p-1.5 rounded-sm"
                      value={this.state.answers[`${index}`] || ""}
                      onChange={(event) => this.handleInputChange(event, index)}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <SubmitQuestion
                  disabled={!this.state.completed}
                  onClick={this.handleSubmit}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
