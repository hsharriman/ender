import React from "react";
import interactiveScreenshot from "../assets/InteractivePageScreenshot.png";
import staticScreenshot from "../assets/StaticPageScreenshot.png";
import {
  interactiveFollowUpQuestions,
  staticFollowUpQuestions,
  susQuestions,
} from "../questions/susQuestions";
import { SubmitQuestion } from "./SubmitQuestion";
import SusQuestion from "./SusQuestion";

interface susPageProps {
  type: string;
  answers: { [question: string]: string };
  updateAnswers: (name: string, question: string, answer: string) => void;
}

interface susPageState {
  answers: { [key: string]: string };
  completed: Boolean;
  submitted: Boolean;
}

export class SusPage extends React.Component<susPageProps, susPageState> {
  // private textQuestions =
  //   this.props.type === "Static"
  //     ? staticFollowUpQuestions
  //     : interactiveFollowUpQuestions;
  constructor(props: susPageProps) {
    super(props);
    this.state = {
      answers: {
        ...susQuestions.reduce((acc, _, index) => {
          acc[index.toString()] = "";
          return acc;
        }, {} as { [key: string]: string }),
        // ...this.textQuestions.reduce((acc, _, index) => {
        //   acc[`text${index}`] = "";
        //   return acc;
        // }, {} as { [key: string]: string }),
      },
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

  handleInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const { value } = event.target;
    this.handleAnswerChange(`text${index}`, value);
    const localAnswers = this.state.answers;
    const allAnswered = Object.values(localAnswers).every(
      (answer) => answer !== ""
    );
    if (allAnswered) {
      this.setState({
        completed: true,
      });
    }
  };

  handleSubmit = () => {
    const localAnswers = this.state.answers;
    const allAnswered = Object.values(localAnswers).every(
      (answer) => answer !== ""
    );

    if (!allAnswered) {
      return;
    }

    const { updateAnswers, type } = this.props;
    let toLogAnswers = "";
    Object.keys(localAnswers).forEach((questionNum) => {
      updateAnswers(type, questionNum, localAnswers[questionNum]);
      toLogAnswers += `Question ${questionNum}: ${localAnswers[questionNum]},`;
    });

    console.log(
      `${this.props.type},SUS,` + toLogAnswers + `,time: ${Date.now()}`
    );

    this.setState({
      submitted: true,
    });
  };

  render() {
    return (
      <>
        {this.state.submitted ? (
          <div className="grid grid-rows-[auto,1fr] gap-2 justify-center flex w-full min-w-[1300px] pt-20">
            <span>
              <h2>
                You've completed all the questions for this page, please move to
                the next page!
              </h2>
            </span>
          </div>
        ) : (
          <div className="grid grid-rows-[auto,1fr] gap-2 justify-center w-full min-w-[1300px]">
            <div>
              {this.props.type === "Static" ? (
                <h2 className="text-2xl font-bold mb-8 text-center mt-8">
                  Static Proof
                </h2>
              ) : (
                <h2 className="text-2xl font-bold mb-8 text-center mt-8">
                  Interactive Proof
                </h2>
              )}
              <div className="grid grid-cols-2">
                <div className="col-start-1 mr-[50px] w-[700px]">
                  <span>
                    You've completed all the geometry questions! Please answer
                    the following questions based on your experiences with the
                    (interactive/static) proofs in this picture.
                    <br />
                    <br />
                    The word "system" in the questions means anything that's
                    visible in the image below. It does not include the test
                    questions.
                  </span>
                  {this.props.type === "Static" ? (
                    <img
                      src={staticScreenshot}
                      alt="Static Proof"
                      className="w-[700px] h-[400px] mr-4 mt-10"
                    />
                  ) : (
                    <img
                      src={interactiveScreenshot}
                      alt="Interactive Proof"
                      className="w-[700px] h-[400px] mr-4 mt-10"
                    />
                  )}
                </div>
                <div className="col-start-2 justify-start">
                  {/* <h2 className="text-xl font-bold mb-2">
                    Survey Instructions
                  </h2>
                  <p className="text-base">
                    Please answer the questions honestly based on your
                    experience.
                  </p>
                  <p className="text-base">
                    For each statement, select the response that best matches
                    your opinion.
                  </p> */}
                  <div className="right-column ml-[50px]">
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
                  <div className="ml-[50px]">
                    <SubmitQuestion
                      disabled={!this.state.completed}
                      onClick={this.handleSubmit}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10 ml-[50px]">
              {/* <div className="right-column ml-10">
                {this.textQuestions.map((question, index) => (
                  <>
                    <div className="flex flex-col justify-start pb-1">
                      <div className="font-bold text-base text-slate-500">
                        Question {index + 1}:
                      </div>
                    </div>
                    <div className="font-bold text-base pb-1">
                      {question.prompt}
                    </div>
                    <div className="text-base">
                      <textarea
                        name={question.prompt}
                        className="border-2 border-black w-full p-1.5 rounded-sm"
                        value={this.state.answers[`text${index}`]}
                        onChange={(event) =>
                          this.handleInputChange(event, index)
                        }
                        rows={6}
                      />
                    </div>
                  </>
                ))}
              </div>
              <SubmitQuestion
                disabled={!this.state.completed}
                onClick={this.handleSubmit}
              />
              </div> */}
            </div>
          </div>
        )}
      </>
    );
  }
}
