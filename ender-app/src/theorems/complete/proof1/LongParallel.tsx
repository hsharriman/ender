import { LongPage } from "../../../components/LongPage";
import { ProofTextItem } from "../../../core/types";
import {
  Givens,
  Proves,
  Step1,
  Step2,
  Step3,
  Step4,
  Step5,
  Step6,
  baseContent,
  miniContent,
  reasons,
  reliesOnText,
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
  let intersect = new Step2();
  intersect.diagram(s2, "s2");

  // STEP 3
  let s3 = baseContent(true, "s3");
  let vertAngs = new Step3();
  vertAngs.diagram(s3, "s3", false);

  // STEP 4
  let s4 = baseContent(true, "s4");
  let SAS = new Step4();
  SAS.diagram(s4, "s4", false);

  // STEP 5
  let s5 = baseContent(true, "s5");
  let corresp = new Step5();
  corresp.diagram(s5, "s5", false);

  // STEP 5
  let s6 = baseContent(true, "s6");
  let alternateAngles = new Step6();
  alternateAngles.diagram(s6, "s6", false);

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
  linkedTexts.push({
    k: "s2",
    v: intersect.text(s2, "s2"),
    reason: "Given",
  });
  // TEXT STEP 2
  linkedTexts.push({
    k: "s3",
    v: vertAngs.text(s3, "s3"),
    reason: "Vertical Angles Theorem",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: "s4",
    v: SAS.text(s4, "s4"),
    reason: "SAS Triangle Congruence",
  });
  // TEXT STEP 4
  linkedTexts.push({
    k: "s5",
    v: corresp.text(s5, "s5"),
    reason: "Corresponding Angles Postulate",
  });
  // TEXT STEP 5
  linkedTexts.push({
    k: "s6",
    v: alternateAngles.text(s6, "s6"),
    reason: "Alternate Interior Angles Theorem",
  });

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
        s6.allSvgElements()("s6"),
      ]}
      reasonText={reasons}
      givenSvg={givenDiag.allSvgElements(true)("given")}
      frames={["s1", "s2", "s3", "s4", "s5", "s6"]}
      miniSvgElements={miniCtx.allSvgElements(true)}
      reliesOn={reliesOnText()}
    />
  );
};
