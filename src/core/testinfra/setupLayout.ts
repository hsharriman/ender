import { PretestAppPageProps } from "../../components/procedure/pages/PretestAppPage";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID, PROVE_ID } from "../../theorems/utils";
import { ProofTextItem, StaticProofTextItem } from "../types/stepTypes";
import { LayoutProps, Reason, SVGModes, TutorialStep } from "../types/types";
import { Page, PageType } from "./pageOrder";
import { fisherYates } from "./randomize";

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
  proofMeta.steps.forEach((step, i) => {
    texts.push({
      stmt: step.staticText(),
      reason: step.reason.title,
    });
    if (step.reason.body !== "" && step.reason.title !== Reasons.Given.title) {
      reasons.push(step.reason);
    }
    const s = ctx.addFrame(`s${i + 1}`);
    step.diagram(ctx, s);
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
        questions: proofMeta.questions,
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
  const ctx = proofMeta.baseContent(true, false);
  const highlightCtx = proofMeta.baseContent(true, false);
  const additionCtx = proofMeta.baseContent(true, false);

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
    v: proofMeta.givens.text,
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: proofMeta.proves.text,
    alwaysActive: true,
  });

  let prevStep = proofMeta.givens;
  proofMeta.steps.forEach((step, i) => {
    let textMeta = {};
    const s = ctx.addFrame(`s${i + 1}`);
    additionCtx.addFrame(`s${i + 1}`);
    step.unfocused({ ctx, frame: s });

    step.additions({ ctx: additionCtx, frame: s, mode: SVGModes.Derived });

    if (step.dependsOn) {
      const depIds = step.dependsOn.map((i) => `s${i}`);
      ctx.reliesOn(s, depIds);
      textMeta = { dependsOn: new Set(depIds) };
    }
    // setup highlighting for interactive diagrams
    if (step.highlight) {
      highlightCtx.addFrame(`s${i + 1}`);
      step.highlight(highlightCtx, s);
    }

    reasonMap.set(s, step.reason);
    linkedTexts.push({
      ...textMeta,
      k: s,
      v: step.text,
      reason: step.reason.title,
    });
    step = { ...step, prevStep: prevStep };
    prevStep = step;
  });
  return {
    type: tutorial ? PageType.Tutorial : PageType.Interactive,
    meta: {
      layout: "interactive",
      props: {
        ctx: ctx.getCtx(),
        reasonMap: reasonMap,
        linkedTexts: linkedTexts,
        pageNum: -1,
        questions: proofMeta.questions,
        name: proofMeta.name,
        highlightCtx: highlightCtx.getCtx(),
        additionCtx: additionCtx.getCtx(),
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
};

export const getHeaderType = (pageType: PageType) => {
  return (
    pageType === PageType.Static ||
    pageType === PageType.Interactive ||
    pageType === PageType.Pretest
  );
};
