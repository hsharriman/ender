import React from "react";
import { logEvent } from "../../core/testinfra/testUtils";
import { TutorialStep, TutorialStepType } from "../../core/types/types";

interface TutorialPopoverProps {
  step: TutorialStep;
  currStep: number;
  numSteps: number;
  paddingL?: number;
  showContinue: boolean;
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

  toDoBullet = (complete: boolean) => {
    const r = 6;
    const styling = complete
      ? "fill-green-400 stroke-green-400"
      : "stroke-red-500 fill-none";
    return (
      <span className="inline-flex mr-2">
        <svg
          width={r * 2}
          height={r * 2}
          viewBox={`0 0 ${r * 2} ${r * 2}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx={r}
            cy={r}
            r={r - 2}
            strokeWidth="2"
            // className={styling}
          ></circle>
        </svg>
      </span>
    );
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
      const continueStyle = this.props.showContinue
        ? "block opacity-1"
        : "hidden opacity-0";

      const exerciseStyle = this.props.showContinue
        ? "text-green-400 leading-relaxed border-green-300 fill-green-300 stroke-green-300 italic"
        : "text-red-500 border-red-500 fill-none stroke-red-500";
      return (
        <div className="">
          <div
            className="absolute z-40 h-[20px] w-[20px] bg-white transform rotate-45 origin-top-left rounded-sm border-2 border-gray-300 shadow-lg focus:outline-none"
            style={{ top: `${style.top + 8}px`, left: `${style.left + 20}px` }}
          ></div>
          <div
            className={`absolute z-40 w-[20rem] p-4 break-words rounded-lg border-2 border-gray-300 bg-white text-sm shadow-lg sfocus:outline-none`}
            id="popover"
            style={{ top: `${style.top}px`, left: `${style.left + 18}px` }}
          >
            <div className="block">
              <p className="text-sm antialiased font-normal leading-relaxed mb-5 text-blue-gray-500">
                <span className="font-bold">
                  {`${this.props.currStep}/${this.props.numSteps}: `}
                </span>
                {step.text}
              </p>
              {step.exercise && (
                <div className="flex flex-col font-bold">
                  Before moving on:
                  <span
                    className={`font-semibold mb-2 transition-all duration-300 ${exerciseStyle}`}
                  >
                    {this.toDoBullet(this.props.showContinue)}
                    {step.exercise}
                  </span>
                </div>
              )}
              {this.props.step.type !== TutorialStepType.HideContinue && (
                <div className="h-8 border-t-2 border-slate-200">
                  <div
                    className={`${continueStyle} flex w-full justify-end align-middle py-2 text-sm`}
                  >
                    <button
                      type="button"
                      onClick={this.props.onClick}
                      className="flex gap-x-2 items-center mr-2 px-2 py-0.5 mb-2 rounded-lg font-bold text-slate-800 border-slate-300 transition-all select-none disabled:pointer-events-none disabled:opacity-50 hover:text-purple-500 hover:stroke-purple-500 hover:border-purple-500 hover:bg-purple-200 stroke-slate-800"
                    >
                      Next
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
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return <></>;
  }
}
