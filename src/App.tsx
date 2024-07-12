import React from "react";
import { BackgroundQuestions } from "./components/BackgroundQuestions";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "./components/InteractiveAppPage";
import SavePage from "./components/SavePage";
import { StaticAppPage, StaticAppPageProps } from "./components/StaticAppPage";
import { SusPage, SusProofType } from "./components/SusPage";
import { TestQuestions } from "./components/TestQuestions";
import { TutorialPage } from "./components/TutorialPage";
import {
  fisherYates,
  interactiveLayout,
  randomizeLayout,
} from "./core/testinfra/setupLayout";
import { ProofMeta } from "./core/types/types";
import { logEvent } from "./core/utils";
import { tutorial1Steps, tutorial3Steps } from "./questions/tutorialContent";
import { T1_S1_C1 } from "./theorems/testA/stage1/C1";
import { T1_S1_C2 } from "./theorems/testA/stage1/C2";
import { T1_S1_C3 } from "./theorems/testA/stage1/C3";
import { T1_S1_IN1 } from "./theorems/testA/stage1/IN1";
import { T1_S1_IN2 } from "./theorems/testA/stage1/IN2";
import { T1_S1_IN3 } from "./theorems/testA/stage1/IN3";
import { T1_S2_C1 } from "./theorems/testA/stage2/C1";
import { T1_S2_C2 } from "./theorems/testA/stage2/C2";
import { T1_S2_IN1 } from "./theorems/testA/stage2/IN1";
import { T1_S2_IN2 } from "./theorems/testA/stage2/IN2";
import { TutorialProof1, TutorialProof2 } from "./theorems/tutorial/tutorial1";

interface AppProps {}
interface AppState {
  activePage: number;
  activeTest: number;
  isPaused: boolean;
  activeQuestionIdx: number;
  answers: {
    [proofName: string]: {
      [question: string]: string;
    };
  };
  page: string;
  scaffolding: {
    [questionType: string]: boolean;
  };
}
export class App extends React.Component<AppProps, AppState> {
  private meta: ProofMeta[] = [];
  private numPages: number;
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
      isPaused: false,
      answers: {},
      page: "home",
      scaffolding: {
        Minifigures: false,
        ReliesOn: false,
        DiagramState: false,
        TutorialInstructions: true,
      },
      activeQuestionIdx: 0,
    };
    const tutorial = [
      interactiveLayout(TutorialProof1, false, tutorial1Steps),
      // interactiveLayout(TutorialProof1, false, tutorial2Steps),
      interactiveLayout(TutorialProof2, false, tutorial3Steps),
    ];
    // const pickTestA = Math.round(Math.random()) === 1; // TODO use when second test implemented
    const stage1 = randomizeLayout(
      fisherYates([
        T1_S1_C1,
        T1_S1_C2,
        T1_S1_C3,
        T1_S1_IN1,
        T1_S1_IN2,
        T1_S1_IN3,
      ]),
      true
    );
    const stage2 = randomizeLayout(
      fisherYates([T1_S2_C1, T1_S2_C2, T1_S2_IN1, T1_S2_IN2]),
      false
    );
    // const challenge = randomizeLayout(fisherYates([T1_CH1_IN1]), false);
    const challenge: ProofMeta[] = [];

    this.meta = tutorial.concat(stage1).concat(stage2).concat(challenge);
    // this.meta = stage1.concat(stage2);
    this.numPages = this.meta.length + 4; // 2 for SUS, 1 for basic questions, 1 for downloading
  }

  componentDidMount() {
    window.document.title = "Ender";
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

  onClickTest = (test: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    this.setState({ page: test });
  };

  onNext = (direction: number) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0, activeQuestionIdx: 0, page: "home" });
    } else {
      this.setState({
        activePage: this.state.activePage + direction,
        activeQuestionIdx: 0,
      });
    }
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

  renderQuestionHeader =
    (proofType: string) =>
    (
      meta: StaticAppPageProps | InteractiveAppPageProps,
      incrementTutorial?: () => boolean
    ) => {
      return (
        <div
          className="sticky top-0 left-0 bg-gray-50 p-6 z-30 border-solid border-b-2 border-gray-300"
          id="header"
        >
          <div className="flex items-center">
            <button
              className="p-3 underline underline-offset-2 z-30 text-sm"
              id="prev-arrow"
              style={{
                display: this.state.activePage >= 0 ? "block" : "none",
              }}
              onClick={() => this.onNext(-1)}
            >
              {"Previous"}
            </button>
            <div className="p-3 z-30">{`${this.state.activePage + 1} / ${
              this.numPages
            }`}</div>
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
              />
            </div>
            <button
              className="absolute right-20 p-3 underline underline-offset-2 z-30 text-sm"
              id="pause"
              onClick={this.handlePause}
            >
              Pause
            </button>
            <button
              className="p-3 underline underline-offset-2 z-30 text-sm"
              id="next-arrow"
              style={{
                display:
                  this.state.activePage < this.numPages - 1 ? "block" : "none",
              }}
              onClick={() => this.onNext(1)}
            >
              {"Next"}
            </button>
          </div>
        </div>
      );
    };

  renderShortHeader = () => {
    return (
      <div className="sticky top-0 left-0 bg-gray-50 p-6 z-30" id="header">
        <button
          className="absolute top-0 left-0 p-3 underline underline-offset-2 z-30 text-sm"
          id="prev-arrow"
          style={{ display: this.state.activePage >= 0 ? "block" : "none" }}
          onClick={() => this.onNext(-1)}
        >
          {"Previous"}
        </button>
        <div className="absolute top-0 p-3 left-24 z-30">{`${
          this.state.activePage + 1
        } / ${this.numPages}`}</div>
        <button
          className="absolute top-0 right-10 p-3 underline underline-offset-2 z-30 text-sm"
          id="pause"
          onClick={this.handlePause}
        >
          Pause
        </button>
        <button
          className="absolute top-0 right-0 p-3 underline underline-offset-2 z-30 text-sm"
          id="next-arrow"
          style={{
            display:
              this.state.activePage < this.numPages - 1 ? "block" : "none",
          }}
          onClick={() => this.onNext(1)}
        >
          {"Next"}
        </button>
      </div>
    );
  };

  renderExperimentPages = () => {
    const page = this.state.activePage - 1; // For current page of proof
    const currMeta = this.meta[page];
    let pageContent = <></>;
    if (this.state.activePage === 0) {
      pageContent = (
        <BackgroundQuestions
          updateAnswers={this.updateAnswers("Background Questions")}
          onSubmitFn={() => this.onNext(1)}
        />
      );
    } else if (this.state.activePage <= 2) {
      pageContent = (
        <TutorialPage
          proof={currMeta.props as InteractiveAppPageProps}
          steps={currMeta.tutorial || []}
          headerFn={this.renderQuestionHeader(currMeta.layout)}
          onStepsComplete={() => this.onNext(1)}
        />
      );
    } else if (this.state.activePage <= this.meta.length) {
      pageContent =
        currMeta.layout === "static" ? (
          <StaticAppPage
            {...{
              ...(currMeta.props as StaticAppPageProps),
              pageNum: page,
            }}
            key={"static-pg" + this.state.activePage}
          />
        ) : (
          <InteractiveAppPage
            {...{
              ...(currMeta.props as InteractiveAppPageProps),
              pageNum: page,
            }}
            key={"interactive-pg" + this.state.activePage}
          />
        );
    } else if (this.state.activePage === this.meta.length + 1) {
      pageContent = (
        <SusPage
          key={this.state.activePage}
          type={SusProofType.Static}
          updateAnswers={this.updateAnswers("Static SUS")}
          onSubmit={() => this.onNext(1)}
        />
      );
    } else if (this.state.activePage === this.meta.length + 2) {
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
        {this.state.activePage > 0 && this.state.activePage <= 2 ? (
          pageContent
        ) : (
          <>
            {this.state.activePage > 0 &&
            this.state.activePage <= this.meta.length
              ? this.renderQuestionHeader(currMeta.layout)(currMeta.props)
              : this.renderShortHeader()}
            <div className="w-full h-full flex justify-start">
              {pageContent}
            </div>
          </>
        )}
      </>
    );
  };

  render() {
    if (this.state.page === "demo") {
      return (
        <>
          <div className="sticky top-0 left-0 bg-gray-50 p-6 z-30" id="header">
            <button
              className="absolute top-0 left-0 p-3 underline underline-offset-2 z-30 text-sm"
              id="prev-arrow"
              style={{ display: this.state.activePage >= 0 ? "block" : "none" }}
              onClick={() => this.onNext(-1)}
            >
              {"Home"}
            </button>
          </div>
          <div className="w-full h-full flex justify-start">
            <InteractiveAppPage
              {...{
                ...(interactiveLayout(T1_S1_C1)
                  .props as InteractiveAppPageProps),
                pageNum: this.state.activePage,
              }}
              key={"interactive-pg" + this.state.activePage}
            />
          </div>
        </>
      );
    } else if (this.state.page === "procedure") {
      return this.renderExperimentPages();
    } else if (this.state.page === "home") {
      return (
        <div className="flex w-screen h-screen justify-center items-center">
          <div className="flex flex-row w-[1100px] h-32 justify-center">
            <button
              className="py-4 px-8 m-4 text-3xl bg-violet-300 rounded-md text-white"
              onClick={this.onClickTest("demo")}
            >
              Demo
            </button>
            <button
              className="py-4 px-8 m-4 text-3xl bg-violet-500 rounded-md text-white"
              onClick={this.onClickTest("procedure")}
            >
              Procedure
            </button>
          </div>
        </div>
      );
    }
    return <></>;
  }
}

export default App;
