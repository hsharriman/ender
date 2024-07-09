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
import { ProofTextItem, StaticProofTextItem } from "./core/types/stepTypes";
import { LayoutProps, Reason, TutorialStep } from "./core/types/types";
import { tutorial1Steps, tutorial2Steps } from "./questions/tutorialContent";
import { Reasons } from "./theorems/reasons";
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
import { GIVEN_ID, PROVE_ID } from "./theorems/utils";

interface ProofMeta {
  layout: LayoutOptions;
  props: StaticAppPageProps | InteractiveAppPageProps;
  tutorial?: TutorialStep[];
}
type LayoutOptions = "static" | "interactive";

/* Helper methods related to randomizing the proof order */
const fisherYates = (arr: any[]) => {
  // shuffle the array with Fisher-Yates algorithm
  const arrCopy = arr.slice();
  for (let i = arrCopy.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }
  // return the shuffled array
  return arrCopy;
};

const staticLayout = (
  proofMeta: LayoutProps,
  shuffleQuestions: boolean = true
): ProofMeta => {
  // reset stored variables
  const ctx = proofMeta.baseContent(true, false);
  const reasons: Reason[] = [];
  const texts: StaticProofTextItem[] = [];

  ctx.addFrame(GIVEN_ID);
  proofMeta.givens.diagram(ctx, GIVEN_ID);
  proofMeta.steps.map((step) => {
    texts.push({
      stmt: step.staticText(),
      reason: step.reason.title,
    });
    if (step.reason.body !== "" && step.reason.title !== Reasons.Given.title) {
      reasons.push(step.reason);
    }
  });
  return {
    layout: "static",
    props: {
      ctx: ctx.getCtx(),
      texts: texts,
      reasons: reasons,
      pageNum: -1,
      givenText: proofMeta.givens.staticText(),
      provesText: proofMeta.proves.staticText(),
      questions: shuffleQuestions
        ? fisherYates(proofMeta.questions)
        : proofMeta.questions,
      name: proofMeta.name,
    },
  };
};
const interactiveLayout = (
  proofMeta: LayoutProps,
  shuffleQuestions: boolean = true,
  tutorial?: TutorialStep[]
): ProofMeta => {
  const ctx = proofMeta.baseContent(true, true);
  const linkedTexts: ProofTextItem[] = [];
  const reasonMap = new Map<string, Reason>();

  // GIVEN
  ctx.addFrame(GIVEN_ID);
  proofMeta.givens.diagram(ctx, GIVEN_ID);

  // PROVE
  ctx.addFrame(PROVE_ID);
  proofMeta.proves.diagram(ctx, PROVE_ID);

  // add given and prove to linkedTexts
  linkedTexts.push({
    k: GIVEN_ID,
    v: proofMeta.givens.text(ctx),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: proofMeta.proves.text(ctx),
    alwaysActive: true,
  });

  proofMeta.steps.map((step, i) => {
    let textMeta = {};
    const s = ctx.addFrame(`s${i + 1}`);
    step.diagram(ctx, s);
    if (step.dependsOn) {
      const depIds = step.dependsOn.map((i) => `s${i}`);
      ctx.reliesOn(s, depIds);
      textMeta = { dependsOn: new Set(depIds) };
    }
    reasonMap.set(s, step.reason);
    linkedTexts.push({
      ...textMeta,
      k: s,
      v: step.text(ctx),
      reason: step.reason.title,
    });
  });
  return {
    layout: "interactive",
    props: {
      ctx: ctx.getCtx(),
      miniCtx: proofMeta.miniContent.getCtx(),
      reasonMap: reasonMap,
      linkedTexts: linkedTexts,
      pageNum: -1,
      questions: shuffleQuestions
        ? fisherYates(proofMeta.questions)
        : proofMeta.questions,
      name: proofMeta.name,
    },
    tutorial,
  };
};

const randomizeLayout = (
  proofMetas: LayoutProps[],
  shuffleQuestions: boolean
): ProofMeta[] => {
  let modes = proofMetas.map((p, i) => {
    return i % 2 === 0 ? "s" : "i";
  });
  return fisherYates(modes).map((m, i) =>
    m === "s"
      ? staticLayout(proofMetas[i], shuffleQuestions)
      : interactiveLayout(proofMetas[i], shuffleQuestions)
  );
  // return proofMetas.map((p) => interactiveLayout(p));
  // return proofMetas.map((p) => staticLayout(p));
};

interface AppProps {}
interface AppState {
  activePage: number;
  activeTest: number;
  answers: {
    [proofName: string]: {
      [question: string]: string;
    };
  };
  page: string;
}
export class App extends React.Component<AppProps, AppState> {
  private meta: ProofMeta[] = [];
  private numPages: number;
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
      answers: {},
      page: "home",
    };
    const tutorial = [
      interactiveLayout(TutorialProof1, false, tutorial1Steps),
      interactiveLayout(TutorialProof2, false, tutorial2Steps),
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

  onClick = (direction: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0, page: "home" });
    } else {
      this.setState({
        activePage: this.state.activePage + direction,
      });
    }
  };

  onClickTest = (test: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    this.setState({ page: test });
  };

  onNext = (direction: number) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0 });
    } else {
      this.setState({
        activePage: this.state.activePage + direction,
      });
    }
  };

  updateAnswers = (proofName: string) => (question: string, answer: string) => {
    const storedAnswers = localStorage.getItem("answers");
    const existingAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};

    const updatedAnswers = {
      ...existingAnswers,
      [proofName]: {
        ...existingAnswers[proofName],
        [question]: { answer, timestamp: new Date().valueOf() },
      },
    };

    localStorage.setItem("answers", JSON.stringify(updatedAnswers));
  };

  renderQuestionHeader =
    (proofType: string) =>
    (
      meta: StaticAppPageProps | InteractiveAppPageProps,
      onSubmit?: () => void,
      questionsCompleted?: () => void
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
              onClick={this.onClick(-1)}
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
                onSubmit={onSubmit}
                proofType={proofType}
                onAnswerUpdate={this.updateAnswers(meta.name)}
                questionsCompleted={questionsCompleted}
              />
            </div>
            <button
              className="p-3 underline underline-offset-2 z-30 text-sm"
              id="next-arrow"
              style={{
                display:
                  this.state.activePage < this.numPages - 1 ? "block" : "none",
              }}
              onClick={this.onClick(1)}
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
          onClick={this.onClick(-1)}
        >
          {"Previous"}
        </button>
        <div className="absolute top-0 p-3 left-24 z-30">{`${
          this.state.activePage + 1
        } / ${this.numPages}`}</div>
        <button
          className="absolute top-0 right-0 p-3 underline underline-offset-2 z-30 text-sm"
          id="next-arrow"
          style={{
            display:
              this.state.activePage < this.numPages - 1 ? "block" : "none",
          }}
          onClick={this.onClick(1)}
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
              onClick={this.onClick(-1)}
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
