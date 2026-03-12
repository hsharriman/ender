import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID, PROVE_ID } from "../../theorems/utils";
import { SVGModes } from "../types/diagramTypes";
import { LayoutProps, ProofMeta, Reason } from "../types/layoutTypes";
import { ProofTextItem, StaticProofTextItem } from "../types/stepTypes";

export const staticLayout = (proofMeta: LayoutProps): ProofMeta => {
  // reset stored variables
  const ctx = proofMeta.baseContent();
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
    layout: "static",
    props: {
      ctx: ctx.getCtx(),
      texts: texts,
      reasons: reasons,
      givenText: proofMeta.givens.staticText(),
      provesText: proofMeta.proves.staticText(),
      name: proofMeta.name,
      diagramAspect: proofMeta.diagramAspect,
    },
  };
};
export const interactiveLayout = (proofMeta: LayoutProps): ProofMeta => {
  const ctx = proofMeta.baseContent();
  const highlightCtx = proofMeta.baseContent();
  const additionCtx = proofMeta.baseContent();

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
      step.highlight({ ctx: highlightCtx, frame: s });
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
    layout: "interactive",
    props: {
      ctx: ctx.getCtx(),
      reasonMap: reasonMap,
      linkedTexts: linkedTexts,
      name: proofMeta.name,
      highlightCtx: highlightCtx.getCtx(),
      additionCtx: additionCtx.getCtx(),
      diagramAspect: proofMeta.diagramAspect,
    },
  };
};
