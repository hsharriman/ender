import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles, EqualAngleStep } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegments,
  EqualSegmentStep,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import {
  exploratoryQuestion,
  S2C2Questions,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = () => {
  let ctx = new Content();
  const [F, A, B, C, D, G] = ctx.addPoints([
    { pt: [1, 9], label: "F", offset: [12, 0] },
    { pt: [2, 1], label: "A", offset: [-10, -15] },
    { pt: [5.5, 6], label: "B", offset: [-3, 10] },
    { pt: [9, 1], label: "C", offset: [-3, -15] },
    { pt: [5.5, 1], label: "D", offset: [-5, -18] },
    { pt: [10, 9], label: "G", offset: [3, 0] },
  ]);

  ctx.addTriangles([
    { pts: [A, B, F] },
    { pts: [A, B, D], rotatePattern: true },
    { pts: [B, C, D] },
    { pts: [B, C, G], rotatePattern: true },
  ]);

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("AC", "BD")(true)}
        {comma}
        {EqualSegments.text(["AD", "DC"])(true)}
        {comma}
        {EqualAngles.text(["FAB", "GCB"])(true)}
        {comma}
        {EqualSegments.text(["AF", "CG"])(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABF").mode(props.frame, props.mode);
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCG").mode(props.frame, props.mode);
    Perpendicular.additions(props, "BD", ["AD", "CD"]);
    EqualSegments.additions(props, ["AD", "DC"]);
    EqualAngles.additions(props, ["FAB", "GCB"]);
    EqualSegments.additions(props, ["AF", "CG"], 2);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions({ ...props, mode: SVGModes.Derived }, ["AFB", "CGB"]),
  text: (active: boolean) => EqualAngles.text(["AFB", "CGB"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: Perpendicular.text("AC", "BD"),
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "CD"]),
});

const step2: StepMeta = EqualSegmentStep(["AD", "DC"], Reasons.Given, step1);
const step3: StepMeta = EqualAngleStep(["FAB", "GCB"], Reasons.Given, step2);
const step4: StepMeta = EqualSegmentStep(["AF", "CG"], Reasons.Given, step3, 2);
const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "BD", 3);
  },
  text: Reflexive.text("BD"),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step5,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  highlight: (props: StepProps) => {
    Perpendicular.highlight(props, "BD", ["AD", "CD"], SVGModes.ReliesOn);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["2", "5", "6"],
  prevStep: step6,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "BDC"], props.mode);
  },
  text: EqualTriangles.text(["ABD", "BCD"]),
  highlight: (props: StepProps) => {
    EqualRightAngles.highlight(props, ["ADB", "BDC"], SVGModes.ReliesOn);
    EqualSegments.highlight(props, ["AD", "DC"], SVGModes.ReliesOn);
    EqualSegments.highlight(props, ["BD", "BD"], SVGModes.ReliesOn, 3);
  },
});

const step8: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["AB", "BC"], Reasons.CPCTC, step7, 4, ["7"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "BDC"], SVGModes.ReliesOn);
  },
});
const step9: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["3", "4", "8"],
  prevStep: step8,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["FAB", "BCG"], props.mode);
  },
  text: EqualTriangles.text(["ABF", "BCG"]),
  highlight: (props: StepProps) => {
    EqualAngles.highlight(props, ["FAB", "BCG"], SVGModes.ReliesOn);
    EqualSegments.highlight(props, ["FA", "GC"], SVGModes.ReliesOn, 2);
    EqualSegments.highlight(props, ["AB", "BC"], SVGModes.ReliesOn, 4);
  },
});

const step10: StepMeta = makeStepMeta({
  ...EqualAngleStep(["AFB", "CGB"], Reasons.CPCTC, step9, 2, ["9"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["FAB", "BCG"], SVGModes.ReliesOn);
  },
});

export const T1_S2_C2: LayoutProps = {
  name: "T1_S2_C2",
  questions: exploratoryQuestion(5, 10),
  shuffleQuestions: S2C2Questions,
  baseContent,
  givens,
  proves,
  steps: [
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
    step8,
    step9,
    step10,
  ],
  title: "Prove Angles Congruent #2",
};
