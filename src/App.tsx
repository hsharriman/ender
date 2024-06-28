import React from "react";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "./components/InteractiveAppPage";
import { StaticAppPage, StaticAppPageProps } from "./components/StaticAppPage";
import { SusPage } from "./components/SusPage";
import { TestQuestions } from "./components/TestQuestions";
import { ProofTextItem, StaticProofTextItem } from "./core/types/stepTypes";
import { LayoutProps, Reason } from "./core/types/types";
import { T1_CH1_IN1 } from "./theorems/challenge/ip3";
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
import { TutorialProof1 } from "./theorems/tutorial/tutorial1";
import { GIVEN_ID, PROVE_ID } from "./theorems/utils";
import { Question } from "./questions/funcTypeQuestions";
import { TestQuestions } from "./components/TestQuestions";
import { BackgroundQuestions } from "./components/BackgroundQuestions";

interface ProofMeta {
  layout: LayoutOptions;
  props: StaticAppPageProps | InteractiveAppPageProps;
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
    },
  };
};
const interactiveLayout = (
  proofMeta: LayoutProps,
  shuffleQuestions: boolean = true
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
    },
  };
};

const randomizeLayout = (
  proofMetas: LayoutProps[],
  shuffleQuestions: boolean = true
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
}
export class App extends React.Component<AppProps, AppState> {
  private meta: ProofMeta[] = [];
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
    };
    const tutorial = [interactiveLayout(TutorialProof1, false)];
    // const pickTestA = Math.round(Math.random()) === 1; // TODO use when second test implemented
    const stage1 = randomizeLayout(
      fisherYates([
        T1_S1_C1,
        T1_S1_C2,
        T1_S1_C3,
        T1_S1_IN1,
        T1_S1_IN2,
        T1_S1_IN3,
      ])
    );
    const stage2 = randomizeLayout(
      fisherYates([T1_S2_C1, T1_S2_C2, T1_S2_IN1, T1_S2_IN2]),
      false
    );
    const challenge = randomizeLayout(fisherYates([T1_CH1_IN1]));

    this.meta = tutorial.concat(stage1).concat(stage2).concat(challenge);
  }

  componentDidMount() {
    window.document.title = "Ender";
  }

  onClick = (direction: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0 });
    } else {
      this.setState({
        activePage: this.state.activePage + direction,
      });
    }
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

  render() {
    const page = this.state.activePage - 1; // For current page of proof
    const numPage = this.meta.length + 3; // For total num of pages
    const currMeta = this.meta[page];
    return (
      <div>
        {this.state.activePage !== 0 &&
        this.state.activePage <= this.meta.length - 1 ? (
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
              <div className="p-3 z-30">{`${
                this.state.activePage + 1
              } / ${numPage}`}</div>
              <div className="ml-10 flex-1">
                <TestQuestions
                  questions={currMeta.props.questions}
                  onNext={this.onNext}
                />
              </div>
              <button
                className="p-3 underline underline-offset-2 z-30 text-sm"
                id="next-arrow"
                style={{
                  display:
                    this.state.activePage < numPage - 1 ? "block" : "none",
                }}
                onClick={this.onClick(1)}
              >
                {"Next"}
              </button>
            </div>
          </div>
        ) : (
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
            } / ${numPage}`}</div>
            <button
              className="absolute top-0 right-0 p-3 underline underline-offset-2 z-30 text-sm"
              id="next-arrow"
              style={{
                display: this.state.activePage < numPage - 1 ? "block" : "none",
              }}
              onClick={this.onClick(1)}
            >
              {"Next"}
            </button>
          </div>
        )}
        <div className="w-full h-full flex justify-start">
          {this.state.activePage === 0 ? (
            <BackgroundQuestions />
          ) : this.state.activePage <= this.meta.length ? (
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
            )
          ) : (
            <SusPage
              key={this.state.activePage}
              type={
                this.state.activePage === this.meta.length + 1
                  ? "Static"
                  : "Interactive"
              }
            />
          )}
        </div>
      </div>
    );
  }
}

export default App;
