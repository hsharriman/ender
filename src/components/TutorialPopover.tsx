import React from "react";
import { TutorialStep, TutorialStepType } from "../core/types/types";
import { logEvent } from "../core/utils";

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
      logEvent("c", {
        c: "tu",
        v: "",
      });
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
            className="absolute z-50 h-[20px] w-[20px] bg-white transform rotate-45 origin-top-left rounded-sm border-2 border-gray-300 shadow-lg focus:outline-none"
            style={{ top: `${style.top + 8}px`, left: `${style.left + 20}px` }}
          ></div>
          <div
            className={`absolute z-50 w-[20rem] p-4 break-words rounded-lg border-2 border-gray-300 bg-white text-sm shadow-lg sfocus:outline-none`}
            id="popover"
            style={{ top: `${style.top}px`, left: `${style.left + 18}px` }}
          >
            <div className="block">
              <p className="text-sm antialiased font-normal leading-relaxed mb-8 text-blue-gray-500">
                <span className="font-bold">
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
          </div>
        </div>
      );
    }
    return <></>;
  }
}
