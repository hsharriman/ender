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
  type: SusProofType;
  onSubmit: () => void;
  updateAnswers: (question: string, answer: string) => void;
}

export enum SusProofType {
  Static = "Static",
  Interactive = "Interactive",
}

interface susPageState {
  answers: { [key: string]: string };
  completed: boolean;
}

export class SusPage extends React.Component<susPageProps, susPageState> {
  private textQuestions =
    this.props.type === "Static"
      ? staticFollowUpQuestions
      : interactiveFollowUpQuestions;
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

    console.log(
      `${this.props.type},SUS,` + toLogAnswers + `,time: ${Date.now()}`
    );
    this.props.onSubmit();
  };

  render() {
    return (
      <>
        <div className="grid grid-rows-[auto,1fr] gap-2 justify-center w-full min-w-[1300px]">
          <div>
            {this.props.type === SusProofType.Static ? (
              <h2 className="text-2xl font-bold mb-8 text-center mt-8">
                Static Proof Usability Questions
              </h2>
            ) : (
              <h2 className="text-2xl font-bold mb-8 text-center mt-8">
                Interactive Proof Usability Questions
              </h2>
            )}
            <div className="grid grid-cols-2">
              <div className="col-start-1 mr-[50px] w-[700px]">
                <span>
                  You've completed all the geometry questions! Please answer the
                  following questions based on your experiences with the
                  <span className="font-bold">
                    {this.props.type === SusProofType.Static
                      ? " static proofs "
                      : " interactive proofs "}
                  </span>
                  in this picture.
                  <br />
                  <br />
                  The word <span className="font-bold">"interface"</span> in the
                  questions means anything that's visible in the image below. It{" "}
                  <span className="font-bold">does not</span> include the test
                  questions.
                </span>
                {this.props.type === SusProofType.Static ? (
                  <img
                    src={staticScreenshot}
                    alt="Static Proof"
                    className="w-[700px] h-[400px] mr-4 mt-10 border border-r-2 border-gray-300 shadow-lg"
                  />
                ) : (
                  <img
                    src={interactiveScreenshot}
                    alt="Interactive Proof"
                    className="w-[700px] h-[400px] mr-4 mt-10 border border-r-2 border-gray-300 shadow-lg"
                  />
                )}
              </div>
              <div className="col-start-2 justify-start">
                <div className="right-column ml-[50px]">
                  {susQuestions.map((question, index) => (
                    <SusQuestion
                      key={index}
                      questionNum={index.toString()}
                      question={question.prompt(this.props.type.toLowerCase())}
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
        </div>
      </>
    );
  }
}
