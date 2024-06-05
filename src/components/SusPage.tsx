import React from "react";
import { Question } from "../questions/completeQuestions";
import { susQuestions } from "../questions/susQuestions";
import { staticFollowUpQuestions } from "../questions/susQuestions";
import { dynamicFollowUpQuestions } from "../questions/susQuestions";
import SusQuestion from "./SusQuestion";
import { SubmitQuestion } from "./SubmitQuestion";

interface susPageProps {
  type: string;
}

interface susPageState {
  textQuestions: Question[];
  answers: { [key: string]: string };
}

export class SusPage extends React.Component<susPageProps, susPageState> {
  constructor(props: susPageProps) {
    super(props);
    console.log(this.props.type);
    const textQuestions =
      this.props.type === "Static"
        ? staticFollowUpQuestions
        : dynamicFollowUpQuestions;
    this.state = {
      textQuestions: textQuestions,
      answers: {
        ...susQuestions.reduce((acc, _, index) => {
          acc[index.toString()] = "";
          return acc;
        }, {} as { [key: string]: string }),
        ...textQuestions.reduce((acc, _, index) => {
          acc[`text${index}`] = "";
          return acc;
        }, {} as { [key: string]: string }),
      },
    };
  }

  handleAnswerChange = (questionNum: string, answer: string) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [questionNum]: answer,
      },
    }));
  };

  handleInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const { value } = event.target;
    this.handleAnswerChange(`text${index}`, value);
  };

  handleSubmit = () => {
    const { answers } = this.state;
    const allAnswered = Object.values(answers).every((answer) => answer !== "");

    if (!allAnswered) {
      alert("Please answer all questions.");
      return;
    }
    console.log("Survey results:", answers);

    alert("Survey submitted successfully!");
  };

  render() {
    return (
      <>
        <div className="grid grid-rows-[auto,1fr] gap-2 pl-10">
          <div className="flex flex-col w-full items-center">
            {this.props.type === "Static" ? (
              <h2 className="text-2xl font-bold mb-4">Static Proof</h2>
            ) : (
              <h2 className="text-2xl font-bold mb-4">Dynamic Proof</h2>
            )}
            <h2 className="text-xl font-bold mb-2">Survey Instructions</h2>
            <p className="text-base">
              Please answer the questions honestly based on your experience.
            </p>
            <p className="text-base">
              For each statement, select the response that best matches your
              opinion.
            </p>
          </div>
          <div className="ml-20 grid grid-cols-2 gap-4 mt-10">
            <div className="left-column">
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
            <div className="right-column ml-60">
              {this.state.textQuestions.map((question, index) => (
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
                      onChange={(event) => this.handleInputChange(event, index)}
                      rows={6}
                    />
                  </div>
                </>
              ))}
            </div>
            <SubmitQuestion onClick={this.handleSubmit} />
          </div>
        </div>
      </>
    );
  }
}
