import { PretestAppPageProps } from "../../components/PretestAppPage";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID, PROVE_ID } from "../../theorems/utils";
import { ProofTextItem, StaticProofTextItem } from "../types/stepTypes";
import { LayoutProps, Reason, TutorialStep } from "../types/types";
import { Page, PageType } from "./pageOrder";

/* Helper methods related to randomizing the proof order */
export const fisherYates = (arr: any[]) => {
  // shuffle the array with Fisher-Yates algorithm
  const arrCopy = arr.slice();
  for (let i = arrCopy.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }
  // return the shuffled array
  return arrCopy;
};

export const staticLayout = (
  proofMeta: LayoutProps,
  shuffleQuestions: boolean = true
): Page => {
  // reset stored variables
  const ctx = proofMeta.baseContent(true, false);
  const reasons: Reason[] = [];
  const texts: StaticProofTextItem[] = [];

  ctx.addFrame(GIVEN_ID);
  proofMeta.givens.diagram(ctx, GIVEN_ID);
  proofMeta.steps.forEach((step) => {
    texts.push({
      stmt: step.staticText(),
      reason: step.reason.title,
    });
    if (step.reason.body !== "" && step.reason.title !== Reasons.Given.title) {
      reasons.push(step.reason);
    }
  });
  return {
    type: PageType.Static,
    meta: {
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
    },
  };
};
export const interactiveLayout = (
  proofMeta: LayoutProps,
  shuffleQuestions: boolean = true,
  tutorial?: TutorialStep[]
): Page => {
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

  proofMeta.steps.forEach((step, i) => {
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
    type: tutorial ? PageType.Tutorial : PageType.Interactive,
    meta: {
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
    },
  };
};

export const pretestLayout = (props: PretestAppPageProps): Page => {
  return {
    type: PageType.Pretest,
    meta: {
      layout: "static",
      props: props,
    },
  };
};

export const randomizeLayout = (
  proofMetas: LayoutProps[],
  shuffleQuestions: boolean
): Page[] => {
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

export const getHeaderType = (pageType: PageType) => {
  return (
    pageType === PageType.Static ||
    pageType === PageType.Interactive ||
    pageType === PageType.Pretest
  );
};
