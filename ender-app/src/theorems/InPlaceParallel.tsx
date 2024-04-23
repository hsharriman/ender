import { AppPage } from "../components/AppPage";
import { ProofTextItem } from "../core/types";
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
} from "./proof1";

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
  let equalAngles = new Step2();
  equalAngles.diagram(ctx, step2);

  // STEP 3
  const step3 = ctx.addFrame("s3");
  let SAS = new Step3();
  SAS.diagram(ctx, step3);

  // STEP 4
  const step4 = ctx.addFrame("s4");
  let correspAngles = new Step4();
  correspAngles.diagram(ctx, step4);

  // STEP 5
  const step5 = ctx.addFrame("s5");
  let alternateAngles = new Step5();
  alternateAngles.diagram(ctx, step5);

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
    v: equalAngles.text(ctx),
    reason: "Vertical Angles Theorem",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: step3,
    v: SAS.text(ctx),
    reason: "SAS Triangle Congruence",
    dependsOn: new Set([step1, step2]),
  });
  // TEXT STEP 4
  linkedTexts.push({
    k: step4,
    v: correspAngles.text(ctx),
    reason: "Corresponding Angles Postulate",
    dependsOn: new Set([step3]),
  });
  // TEXT STEP 5
  linkedTexts.push({
    k: step5,
    v: alternateAngles.text(ctx),
    reason: "Alternate Interior Angles Theorem",
    dependsOn: new Set([step4]), // TODO repetitive, same as ctx.deps
  });

  // RELIES ON:
  // STEP 3
  ctx.reliesOn(step3, [step1, step2]);
  // STEP 4
  ctx.reliesOn(step4, [step3]);
  // STEP 5
  ctx.reliesOn(step5, [step4]);

  return { ctx, linkedTexts };
};

export const InPlaceParallel = () => {
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
