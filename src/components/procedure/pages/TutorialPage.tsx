import React from "react";
import { TutorialStep, TutorialStepType } from "../../../core/types/types";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "../../ender/InteractiveAppPage";
import { StaticAppPageProps } from "../../ender/StaticAppPage";
import { TutorialPopover } from "../../ender/TutorialPopover";

export interface TutorialPageProps {
  steps: TutorialStep[]; // ID for each item where popover should be attached, should include L, R, T, B to know where to attach
  proof: InteractiveAppPageProps;
  headerFn: (
    meta: StaticAppPageProps | InteractiveAppPageProps,
    enabled: boolean,
    onSubmit: () => boolean
  ) => JSX.Element;
  onStepsComplete: () => void;
}
export interface TutorialPageState {
  currStep: number;
  displayedStep: number;
  showContinue: boolean;
  submitEnabled: boolean;
}
export class TutorialPage extends React.Component<
  TutorialPageProps,
  TutorialPageState
> {
  constructor(props: TutorialPageProps) {
    super(props);

    this.state = {
      currStep: 0,
      displayedStep: 1, // shows step number to user, doesn't incl popups
      showContinue: false,
      submitEnabled: false,
    };
  }

  componentDidMount() {
    document.addEventListener("click", this.activeElems);
    document.addEventListener("hover", this.activeElems);
    document.addEventListener("mouseover", this.activeElems);
    document.addEventListener("keydown", this.activeElems);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.activeElems);
    document.removeEventListener("hover", this.activeElems);
    document.removeEventListener("mouseover", this.activeElems);
    document.removeEventListener("keydown", this.activeElems);
  }

  onQuestionSubmit = () => {
    this.onClick();
    // there are no questions remaining, ok to move to next page
    return this.state.currStep === this.props.steps.length - 1;
  };

  onClick = () => {
    if (this.state.currStep < this.props.steps.length - 1) {
      const stepType = this.props.steps[this.state.currStep].type;
      this.setState((prevState) => ({
        currStep: prevState.currStep + 1,
        displayedStep:
          stepType === TutorialStepType.Popup
            ? prevState.displayedStep
            : prevState.displayedStep + 1,
        showContinue: false,
      }));
      this.resetActiveElems();
    } else {
      this.setState({ currStep: 0, displayedStep: 1, showContinue: false });
      this.resetActiveElems();
      // if the last step is a popup, that means it is showing information about the answer that was picked,
      // show it before moving to the next proof.
      if (
        this.props.steps[this.state.currStep].type === TutorialStepType.Popup
      ) {
        this.props.onStepsComplete();
      }
    }
  };

  resetActiveElems = () => {
    const interacted = document.querySelectorAll(".activeTutorial");
    Array.from(interacted).forEach((m) => m.classList.remove("activeTutorial"));
  };

  activeElems = (e: Event) => {
    if (!this.state.showContinue) {
      const ids = this.props.steps[this.state.currStep].listenerId;
      ids.forEach((id) => {
        const elem = document.getElementById(id);
        if (elem && elem.classList.contains("activeTutorial")) {
          this.setState({ showContinue: true });
        }
      });
    }
  };

  onQuestionsCompleted = () => {
    this.setState({ currStep: 0 });
  };

  popup = (step: TutorialStep) => {
    return (
      <div className="absolute top-0 left-0 z-50 bg-gray-500 bg-opacity-75 w-screen h-screen">
        <div className="flex min-h-full min-w-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg">
            <div className="sm:flex sm:items-start px-4 py-4 sm:p-6 sm:pb-4">
              <div className="text-center sm:text-left">
                <h3
                  className="text-base font-semibold leading-6 text-gray-900"
                  id="modal-title"
                >
                  {step.headerText}
                </h3>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">{step.text}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 sm:ml-3 sm:w-auto"
                onClick={this.onClick}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const step = this.props.steps[this.state.currStep];
    const submitEnabled = step.type === TutorialStepType.HideContinue;
    const numSteps = this.props.steps.filter(
      (s) => s.type !== TutorialStepType.Popup
    ).length;
    return (
      <div className="w-full h-full flex flex-col justify-start">
        {this.props.headerFn(
          this.props.proof,
          submitEnabled,
          this.onQuestionSubmit
        )}
        <div className="w-full h-full flex justify-start">
          {step && step.type === TutorialStepType.Popup && this.popup(step)}
          {step && step.type !== TutorialStepType.Popup && (
            <TutorialPopover
              step={step}
              currStep={this.state.displayedStep}
              numSteps={numSteps}
              onClick={this.onClick}
              paddingL={step.paddingL}
              showContinue={this.state.showContinue}
            />
          )}
          <InteractiveAppPage {...this.props.proof} isTutorial={true} />
        </div>
      </div>
    );
  }
}
