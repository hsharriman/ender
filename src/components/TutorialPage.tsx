import React from "react";
import { Question } from "../questions/funcTypeQuestions";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "./InteractiveAppPage";

interface TutorialStep {
  elemId: string;
  headerText: string;
  text: string;
  listenerId?: string; // the element that needs to be interacted with to be able to move on
}

export interface TutorialPageProps {
  steps: TutorialStep[]; // ID for each item where popover should be attached, should include L, R, T, B to know where to attach
  proof: InteractiveAppPageProps;
  questions: Question[];
}
export interface TutorialPageState {
  currStep: number;
}
export class TutorialPage extends React.Component<
  TutorialPageProps,
  TutorialPageState
> {
  constructor(props: TutorialPageProps) {
    super(props);

    this.state = {
      currStep: 0,
    };
  }
  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.currStep < this.props.questions.length - 1) {
      this.setState((prevState) => ({
        currStep: prevState.currStep + 1,
      }));
    }
  };
  activeElems = () => {
    const id = this.props.steps[this.state.currStep];
    // find all active items? could be multiple at a time
    // active items are set in onClick/onHover handlers of each component
    // scan through them for the one that we need to be able to move on
    document.querySelectorAll(".activeItem").forEach((elem) => {});
  };
  popup = () => {
    return (
      <>
        <div className="relative z-50">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3
                        className="text-base font-semibold leading-6 text-gray-900"
                        id="modal-title"
                      >
                        {this.props.steps[0].headerText}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {this.props.steps[0].text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 sm:ml-3 sm:w-auto"
                    onClick={this.onClick}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  popOver = () => {
    const step = this.props.steps[this.state.currStep];
    const elem = document.getElementById(step.elemId);
    if (elem) {
      const dims = elem.getBoundingClientRect();
      const style = {
        top: `${dims.top + window.scrollY}px`,
        left: `${dims.right + window.scrollX}px`,
      };
      return (
        <div>
          <div
            className={`absolute z-50 grid w-[28rem] grid-cols-2 overflow-hidden whitespace-normal break-words rounded-lg border border-blue-gray-50 bg-white p-0 font-sans text-sm font-normal text-blue-gray-500 shadow-lg shadow-blue-gray-500/10 focus:outline-none`}
            id="popover-with-image"
            style={{ top: style.top, left: style.left }}
          >
            <div className="p-4">
              <p className="block mb-2 font-sans text-lg antialiased font-bold text-blue-gray-900">
                {`${this.state.currStep}/${this.props.steps.length - 1}: ${
                  step.headerText
                }`}
              </p>
              <p className="block font-sans text-sm antialiased font-normal leading-normal mb-8 text-blue-gray-500">
                {step.text}
              </p>
              <a href="#" className="inline-block -ml-3">
                <button
                  className="flex items-center px-4 py-2 font-sans text-xs font-bold text-center text-gray-900 capitalize align-middle transition-all rounded-lg select-none gap-x-2 hover:bg-gray-900/10 active:bg-gray-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  type="button"
                  onClick={this.onClick}
                >
                  Continue
                  <svg
                    width="7"
                    height="12"
                    viewBox="0 0 7 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.25 1.91669L5.33333 6.00002L1.25 10.0834"
                      stroke="#212121"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </button>
              </a>
            </div>
            {/* <div className="min-h-full !w-full p-3">
              <img
                src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&amp;ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dGVhbSUyMGJ1aWxkaW5nfGVufDB8fDB8fA%3D%3D&amp;auto=format&amp;fit=crop&amp;w=800&amp;q=60"
                alt="image"
                className="object-cover w-full h-full rounded-lg"
              />
            </div> */}
          </div>
        </div>
      );
    }
    return <></>;
  };
  render() {
    return (
      <>
        {this.state.currStep === 0 && this.popup()}
        {this.state.currStep > 0 &&
          this.props.steps[this.state.currStep] &&
          this.popOver()}
        <InteractiveAppPage {...this.props.proof} />
      </>
    );
  }
}
