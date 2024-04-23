import { LongPage } from "../components/LongPage";
import { ProofTextItem } from "../core/types";
import {
  Givens,
  Proves,
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
  baseContent,
  miniContent,
  reasons,
} from "./proof1";

export const ParallelLongForm = () => {
  // render list of all components ONCE  completed list of states
  // GIVEN
  let givenDiag = baseContent(true, "given");
  let defaults = new Givens();
  defaults.diagram(givenDiag, "given");

  // PROVE
  // old content should be rendered as unfocused
  let proveDiag = baseContent(true, "prove");
  let proves = new Proves();
  proves.diagram(proveDiag, "prove");

  // STEP 1
  let s1 = baseContent(true, "s1");
  let givens = new Step1();
  givens.diagram(s1, "s1", false);

  // STEP 2
  let s2 = baseContent(true, "s2");
  let equalAngles = new Step2();
  equalAngles.diagram(s2, "s2", false);

  // STEP 3
  let s3 = baseContent(true, "s3");
  let SAS = new Step3();
  SAS.diagram(s3, "s3", false);

  // STEP 4
  let s4 = baseContent(true, "s4");
  let correspAngles = new Step4();
  correspAngles.diagram(s4, "s4", false);

  // STEP 5
  let s5 = baseContent(true, "s5");
  let alternateAngles = new Step5();
  alternateAngles.diagram(s5, "s5", false);

  const linkedTexts: ProofTextItem[] = [];
  linkedTexts.push({
    k: "given",
    v: defaults.ticklessText(givenDiag),
  });
  linkedTexts.push({
    k: "prove",
    v: proves.ticklessText(givenDiag),
  });
  // onClick linked text needs attached segment AND tick mark
  // TEXT STEP 1
  linkedTexts.push({
    k: "s1",
    v: givens.text(s1, "s1"),
    reason: "Given",
  });
  // TEXT STEP 2
  linkedTexts.push({
    k: "s2",
    v: equalAngles.text(s2, "s2"),
    reason: "Vertical Angles Theorem",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: "s3",
    v: SAS.text(s3, "s3"),
    reason: "SAS Triangle Congruence",
  });
  // TEXT STEP 4
  linkedTexts.push({
    k: "s4",
    v: correspAngles.text(s4, "s4"),
    reason: "Corresponding Angles Postulate",
  });
  // TEXT STEP 5
  linkedTexts.push({
    k: "s5",
    v: alternateAngles.text(s5, "s5"),
    reason: "Alternate Interior Angles Theorem",
  });

  // RELIES ON:
  // STEP 3
  s3.reliesOn("s3", ["s1", "s2"]);
  // STEP 4
  s4.reliesOn("s4", ["s3"]);
  // STEP 5
  s5.reliesOn("s5", ["s4"]);
  const miniCtx = miniContent();

  return (
    <LongPage
      proofText={linkedTexts}
      svgElements={[
        s1.allSvgElements()("s1"),
        s2.allSvgElements()("s2"),
        s3.allSvgElements()("s3"),
        s4.allSvgElements()("s4"),
        s5.allSvgElements()("s5"),
      ]}
      reasonText={reasons}
      givenSvg={givenDiag.allSvgElements(true)("given")}
      frames={["s1", "s2", "s3", "s4", "s5"]}
      miniSvgElements={miniCtx.allSvgElements(true)}
    />
  );
};
