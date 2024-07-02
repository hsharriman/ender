import React from "react";
import { TutorialStep, TutorialStepType } from "../core/types/types";

interface TutorialPopoverProps {
  step: TutorialStep;
  currStep: number;
  numSteps: number;
  paddingL?: number;
  onClick: () => void;
}
interface TutorialPopoverState {
  exerciseDone: boolean;
}
export class TutorialPopover extends React.Component<
  TutorialPopoverProps,
  TutorialPopoverState
> {
  constructor(props: TutorialPopoverProps) {
    super(props);
    this.state = {
      exerciseDone: false,
    };
  }

  onClick = () => {
    if (this.state.exerciseDone) {
      this.props.onClick();
    }
  };

  render() {
    const step = this.props.step;
    const elem = document.getElementById(step.elemId);
    if (elem) {
      const dims = elem.getBoundingClientRect();
      const style = {
        top: dims.top + window.scrollY - 8,
        left: dims.right + window.scrollX + 4 + (this.props.paddingL || 0),
      };
      return (
        <div className="">
          <div
            className="absolute z-50 h-[20px] w-[20px] bg-white transform rotate-45 origin-top-left rounded-sm border-2 border-gray-300 shadow-lg shadow-blue-gray-500/10 focus:outline-none"
            style={{ top: `${style.top + 8}px`, left: `${style.left + 20}px` }}
          ></div>
          <div
            className={`absolute z-50 w-[20rem] break-words rounded-lg border-2 border-gray-300 bg-white p-0 text-sm text-blue-gray-500 shadow-lg shadow-blue-gray-500/10 focus:outline-none`}
            id="popover"
            style={{ top: `${style.top}px`, left: `${style.left + 18}px` }}
          >
            <div className="p-4 block font-sans">
              <p className="text-sm antialiased font-normal leading-normal mb-8 text-blue-gray-500">
                <span className="mb-2 text-md antialiased font-bold text-blue-gray-900">
                  {`${this.props.currStep}/${this.props.numSteps - 1}: `}
                </span>
                {step.text}
              </p>
              {step.exercise && (
                <span className={`font-semibold mb-2 text-blue-700`}>
                  {step.exercise}
                </span>
              )}
              {this.props.step.type !== TutorialStepType.HideContinue && (
                <button
                  className="flex w-full justify-end align-middle py-2 text-xs font-bold text-left text-gray-900 transition-all select-none disabled:pointer-events-none disabled:opacity-50 hover:text-purple-500 hover:stroke-purple-500 stroke-black underline underline-offset-4"
                  type="button"
                  onClick={this.props.onClick}
                >
                  <div className="flex gap-x-2 items-center mr-2">
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
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </div>
                </button>
              )}
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
  }
}
