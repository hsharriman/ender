import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import {
  IN2questions,
  exploratoryQuestion,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = () => {
  let ctx = new Content();

  const [J, L, K, M] = ctx.addPoints([
    { pt: [2, 9], label: "J", offset: [-15, -15] },
    { pt: [9, 9], label: "L", offset: [8, -15] },
    { pt: [5.5, 1], label: "K", offset: [-5, -17] },
    { pt: [5.5, 9], label: "M", offset: [-5, 6] },
  ]);

  ctx.addTriangles([
    { pts: [J, M, K] },
    { pts: [L, M, K], rotatePattern: true },
  ]);

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("JL", "MK")(true)}
        {comma}
        {EqualSegments.text(["JK", "LK"])(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("JMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
    Perpendicular.additions(props, "MK", ["JM", "ML"]);
    EqualSegments.additions(props, ["JK", "LK"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["JMK", "LMK"], SVGModes.Derived);
  },
  text: (active: boolean) => EqualTriangles.text(["JMK", "LMK"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    Perpendicular.additions(props, "MK", ["JM", "ML"]);
  },
  text: Perpendicular.text("JL", "MK"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["JK", "LK"]);
  },
  text: EqualSegments.text(["JK", "LK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["JMK", "LMK"]);
  },
  text: EqualRightAngles.text(["JMK", "LMK"]),
  highlight: (props: StepProps) => {
    Perpendicular.highlight(props, "MK", ["JM", "ML"], SVGModes.ReliesOn);
  },
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: Reflexive.text("MK"),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.AAS,
  dependsOn: ["2", "3", "4?"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["KJM", "KLM"], props.mode);
  },
  text: EqualTriangles.text(["JMK", "LMK"]),
  highlight: (props: StepProps) => {
    EqualSegments.highlight(props, ["JK", "LK"], SVGModes.ReliesOn);
    EqualRightAngles.highlight(props, ["JMK", "LMK"], SVGModes.ReliesOn);
    EqualAngles.highlight(props, ["KJM", "KLM"], SVGModes.Inconsistent);
  },
});

export const T1_S1_IN2: LayoutProps = {
  name: "T1_S1_IN2",
  questions: exploratoryQuestion(3, 5),
  shuffleQuestions: IN2questions,
  baseContent,
  steps: [step1, step2, step3, step4, step5],
  givens,
  proves,
  title: "Prove Triangles Congruent #2[M]",
};
