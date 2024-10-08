import React from "react";
import { NavLink } from "react-router-dom";
import { BackgroundQuestions } from "../components/BackgroundQuestions";
import { InstructionPage } from "../components/InstructionPage";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "../components/InteractiveAppPage";
import { IntroExperimentPage } from "../components/IntroExpPage";
import {
  PretestAppPage,
  PretestAppPageProps,
} from "../components/PretestAppPage";
import { RestPage } from "../components/RestPage";
import { SavePage } from "../components/SavePage";
import { StartPage } from "../components/StartPage";
import { StaticAppPage, StaticAppPageProps } from "../components/StaticAppPage";
import { SusPage, SusProofType } from "../components/SusPage";
import { TestQuestions } from "../components/TestQuestions";
import { TutorialPage } from "../components/TutorialPage";
import { Page, PageType, pageOrder } from "../core/testinfra/pageOrder";
import { getHeaderType } from "../core/testinfra/setupLayout";
import { logEvent } from "../core/utils";

interface ProcedureState {
  activePage: number;
  activeTest: number;
  isPaused: boolean;
  activeQuestionIdx: number;
  answers: {
    [proofName: string]: {
      [question: string]: string;
    };
  };
  scaffolding: {
    [questionType: string]: boolean;
  };
}
export class Procedure extends React.Component<{}, ProcedureState> {
  private meta: Page[] = [];
  private numPages: number = 0;
  constructor(props: any) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
      isPaused: false,
      answers: {},
      scaffolding: {
        Minifigures: false,
        ReliesOn: false,
        DiagramState: false,
        TutorialInstructions: true,
      },
      activeQuestionIdx: 0,
    };
    this.meta = pageOrder();
    this.numPages = this.meta.length;
  }

  handlePause = () => {
    this.setState({ isPaused: true });
    logEvent("pa", {
      c: "",
      v: "",
    });
  };

  handleResume = () => {
    this.setState({ isPaused: false });
    logEvent("r", {
      c: "",
      v: "",
    });
  };

  onNext = (direction: number) => {
    this.setState({
      activePage: this.state.activePage + direction,
      activeQuestionIdx: 0,
    });
  };

  setActiveQuestionIndex = (newIndex: number) => {
    this.setState({ activeQuestionIdx: newIndex });
  };

  updateScaffolding = (questionType: string) => {
    this.setState((prevState) => ({
      scaffolding: {
        ...prevState.scaffolding,
        [questionType]: true,
      },
    }));
  };

  updateAnswers =
    (proofName: string) =>
    (question: string, answer: string, version?: string) => {
      const storedAnswers = localStorage.getItem("answers");
      const existingAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};

      const updatedAnswers = {
        ...existingAnswers,
        [proofName]: {
          ...existingAnswers[proofName],
          [question]: { answer, timestamp: new Date().valueOf(), version },
        },
      };

      localStorage.setItem("answers", JSON.stringify(updatedAnswers));
    };

  renderShortHeader = () => {
    return (
      <div className="sticky top-0 left-0 bg-gray-50 z-30" id="header">
        <div className="flex items-center">
          {this.renderBackBtn()}
          <div className="p-3 left-24 z-30">{`${this.state.activePage + 1} / ${
            this.numPages
          }`}</div>
          <div className="absolute top-0 right-2 flex flex-row">
            <button
              className="p-3 underline underline-offset-2 z-30 text-sm text-slate-300"
              id="pause"
              onClick={this.handlePause}
            >
              Pause
            </button>
            <button
              className="p-3 underline underline-offset-2 z-30 text-sm text-slate-300"
              id="next-arrow"
              style={{
                display:
                  this.state.activePage < this.numPages - 1 ? "block" : "none",
              }}
              onClick={() => this.onNext(1)}
            >
              {"Skip"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderBackBtn = () => {
    const css =
      "py-3 pl-3 pr-1 underline underline-offset-2 z-30 text-sm text-slate-300";
    return this.state.activePage === 0 ? (
      <NavLink to="/ender" className={css}>
        Home
      </NavLink>
    ) : (
      <button
        className={css}
        id="prev-arrow"
        style={{
          display: this.state.activePage >= 0 ? "block" : "none",
        }}
        onClick={() => this.onNext(-1)}
      >
        {"Back"}
      </button>
    );
  };

  renderQuestionHeader =
    (proofType: string) =>
    (
      meta: StaticAppPageProps | InteractiveAppPageProps | PretestAppPageProps,
      answersEnabled: boolean,
      incrementTutorial?: () => boolean
    ) => {
      return (
        <div
          className="sticky top-0 left-0 bg-gray-50 px-6 py-3 z-30 border-solid border-b-2 border-gray-300"
          id="header"
        >
          <div className="flex items-center">
            {this.renderBackBtn()}
            <div className="p-3 z-30">
              {`${this.state.activePage + 1} / ${this.numPages}`}
            </div>
            <div className="ml-10 flex-1">
              <TestQuestions
                questions={meta.questions}
                onNext={this.onNext}
                proofType={proofType}
                questionIdx={this.state.activeQuestionIdx}
                onAnswerUpdate={this.updateAnswers(meta.name)}
                scaffolding={this.state.scaffolding}
                updateScaffolding={this.updateScaffolding}
                setActiveQuestionIndex={this.setActiveQuestionIndex}
                incrementTutorial={incrementTutorial}
                submitEnabled={answersEnabled}
              />
            </div>
            <div className="flex flex-row gap-2 absolute right-3">
              <button
                className="py-1 underline underline-offset-2 z-30 text-xs text-slate-300"
                id="pause"
                onClick={this.handlePause}
              >
                Pause
              </button>
              <button
                className="py-1 px-1 underline underline-offset-2 z-30 text-xs text-slate-300"
                id="next-arrow"
                style={{
                  display:
                    this.state.activePage < this.numPages - 1
                      ? "block"
                      : "none",
                }}
                onClick={() => this.onNext(1)}
              >
                {"Skip"}
              </button>
            </div>
          </div>
        </div>
      );
    };

  render() {
    const page = this.state.activePage; // For current page of proof
    const currMeta = this.meta[page];
    let pageContent = <></>;
    if (currMeta.type === PageType.ParticipantID) {
      pageContent = <StartPage onNext={() => this.onNext(1)} />;
    } else if (currMeta.type === PageType.Background) {
      pageContent = (
        <BackgroundQuestions
          updateAnswers={this.updateAnswers("Background Questions")}
          onSubmitFn={() => this.onNext(1)}
        />
      );
    } else if (currMeta.type === PageType.IntroSlideTest) {
      pageContent = <IntroExperimentPage onNext={() => this.onNext(1)} />;
    } else if (currMeta.type === PageType.Tutorial && currMeta.meta) {
      pageContent = (
        <TutorialPage
          proof={currMeta.meta.props as InteractiveAppPageProps}
          steps={currMeta.meta.tutorial || []}
          headerFn={this.renderQuestionHeader(currMeta.meta.layout)}
          onStepsComplete={() => this.onNext(1)}
        />
      );
    } else if (currMeta.type === PageType.IntroSlidePhase1) {
      pageContent = <InstructionPage onNext={() => this.onNext(1)} />;
    } else if (currMeta.type === PageType.IntroSlidePhase2) {
      pageContent = <RestPage onNext={() => this.onNext(1)} />;
    } else if (currMeta.type === PageType.Pretest && currMeta.meta) {
      const props = currMeta.meta.props as PretestAppPageProps;
      pageContent = (
        <PretestAppPage
          name={props.name}
          ctx={props.ctx}
          questions={props.questions}
        />
      );
    } else if (currMeta.type === PageType.Static && currMeta.meta) {
      pageContent = (
        <StaticAppPage
          {...{
            ...(currMeta.meta.props as StaticAppPageProps),
            pageNum: page,
          }}
          key={"static-pg" + this.state.activePage}
        />
      );
    } else if (currMeta.type === PageType.Interactive && currMeta.meta) {
      pageContent = (
        <InteractiveAppPage
          {...{
            ...(currMeta.meta.props as InteractiveAppPageProps),
            pageNum: page,
          }}
          key={"interactive-pg" + this.state.activePage}
        />
      );
    } else if (currMeta.type === PageType.StaticSUS) {
      pageContent = (
        <SusPage
          key={this.state.activePage}
          type={SusProofType.Static}
          updateAnswers={this.updateAnswers("Static SUS")}
          onSubmit={() => this.onNext(1)}
        />
      );
    } else if (currMeta.type === PageType.IntSUS) {
      pageContent = (
        <SusPage
          key={this.state.activePage}
          type={SusProofType.Interactive}
          updateAnswers={this.updateAnswers("Interactive SUS")}
          onSubmit={() => this.onNext(1)}
        />
      );
    } else {
      pageContent = <SavePage answers={this.state.answers} />;
    }

    const isQuestionHeader = getHeaderType(currMeta.type);
    let header = this.renderShortHeader();
    if (currMeta.meta) {
      if (isQuestionHeader) {
        header = this.renderQuestionHeader(currMeta.meta.layout)(
          currMeta.meta.props,
          true // always allow questions to be submitted
        );
      } else if (currMeta.type === PageType.Tutorial) {
        // tutorial defines its own header
        header = <></>;
      }
    }
    return (
      <>
        {this.state.isPaused && (
          <div className="absolute top-0 left-0 z-50 bg-gray-500 bg-opacity-75 w-screen h-screen flex items-center justify-center">
            <button
              onClick={this.handleResume}
              className="bg-green-500 hover:bg-green-700 text-4xl text-white font-bold py-3 px-5 rounded flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mr-2"
              >
                <polygon
                  strokeWidth={2}
                  points="10,5 34,20 10,35"
                  className="fill-current text-white"
                />
              </svg>
              Resume
            </button>
          </div>
        )}
        {header}
        <div className="w-full h-full flex justify-start">{pageContent}</div>
      </>
    );
  }
}
