import { AppPage } from "../../../components/AppPage";
import { ProofTextItem } from "../../../core/types";
import {
  miniContent,
  reasons,
  baseContent,
  Givens,
  Proves,
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
  Step6,
} from "../proof2/proof2";

const contents = () => {
  let ctx = baseContent(true);

  // GIVEN
  const given = ctx.addFrame("given");
  let defaults = new Givens();
  defaults.diagram(ctx, given);

  // PROVE
  // old content should be rendered as unfocused
  const prove = ctx.addFrame("prove");
  let proves = new Proves();
  proves.diagram(ctx, prove);

  // STEP 1
  const step1 = ctx.addFrame("s1");
  let givens = new Step1();
  givens.diagram(ctx, step1);

  // STEP 2
  const step2 = ctx.addFrame("s2");
  let perpLines = new Step2();
  perpLines.diagram(ctx, step2);

  // STEP 3
  const step3 = ctx.addFrame("s3");
  let reflex = new Step3();
  reflex.diagram(ctx, step3);

  // STEP 4
  const step4 = ctx.addFrame("s4");
  let ASA = new Step4();
  ASA.diagram(ctx, step4);

  // STEP 5
  const step5 = ctx.addFrame("s5");
  let corresp = new Step5();
  corresp.diagram(ctx, step5);

  // STEP 6
  const step6 = ctx.addFrame("s6");
  let midpoint = new Step6();
  midpoint.diagram(ctx, step6);

  const linkedTexts: ProofTextItem[] = [];
  linkedTexts.push({
    k: given,
    v: defaults.text(ctx),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: prove,
    v: proves.text(ctx),
    alwaysActive: true,
  });
  // onClick linked text needs attached segment AND tick mark
  // TEXT STEP 1
  linkedTexts.push({
    k: step1,
    v: givens.text(ctx),
    reason: "Given", // TODO figure this out automatically based on KEY instead of array index
  });
  // TEXT STEP 2
  linkedTexts.push({
    k: step2,
    v: perpLines.text(ctx),
    reason: "Def. Perpendicular Lines",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: step3,
    v: reflex.text(ctx),
    reason: "Reflexive Property",
  });
  // TEXT STEP 4
  linkedTexts.push({
    k: step4,
    v: ASA.text(ctx),
    reason: "ASA Triangle Congruence",
    dependsOn: new Set([step1, step2, step3]),
  });
  // TEXT STEP 5
  linkedTexts.push({
    k: step5,
    v: corresp.text(ctx),
    reason: "Corresponding Segments Postulate",
    dependsOn: new Set([step4]), // TODO repetitive, same as ctx.deps
  });
  linkedTexts.push({
    k: step6,
    v: midpoint.text(ctx),
    reason: "Def. Midpoint",
    dependsOn: new Set([step5]),
  });

  // RELIES ON:
  // STEP 4
  ctx.reliesOn(step4, [step1, step2, step3]);
  // STEP 5
  ctx.reliesOn(step5, [step4]);
  // STEP 6
  ctx.reliesOn(step6, [step5]);

  return { ctx, linkedTexts };
};

export const InPlaceProof2 = () => {
  // render list of all components ONCE  completed list of states
  const { ctx, linkedTexts } = contents();
  const miniCtx = miniContent();

  return (
    <AppPage
      proofText={linkedTexts}
      svgElements={ctx.allSvgElements()}
      reasonText={reasons}
      miniSvgElements={miniCtx.allSvgElements(true)}
      reliesOn={ctx.getReliesOn()}
      onClickCanvas={function (): void {
        throw new Error("Function not implemented.");
      }}
    />
  );
};
