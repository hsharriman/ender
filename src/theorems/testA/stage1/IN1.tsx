import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { SAS } from "../../../core/reasons/SAS";
import {
  IN1questions,
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

const baseContent = () => {
  let ctx = new Content();
  const [A, B, D, C] = ctx.addPoints([
    { pt: [1, 2], label: "A", offset: [-15, -10] },
    { pt: [10, 2], label: "B", offset: [10, -10] },
    { pt: [5, 9], label: "D", offset: [-25, -10] },
    { pt: [14, 9], label: "C", offset: [3, -10] },
  ]);

  ctx.addTriangles([
    { pts: [A, B, D], label: "ABD" },
    { pts: [B, C, D], label: "CDB", rotatePattern: true },
  ]);

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {EqualSegments.text(["AD", "BC"])(true)}
        {comma}
        {EqualSegments.text(["AB", "DC"])(true)}
        {comma}
        {EqualAngles.text(["ABD", "CDB"])(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CDB").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["AD", "BC"]);
    EqualSegments.additions(props, ["AB", "DC"], 2);
    EqualAngles.additions(props, ["ABD", "CDB"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions({ ...props, mode: SVGModes.Derived }, ["BAD", "DCB"]);
  },
  text: (active: boolean) => EqualAngles.text(["BAD", "DCB"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "BC"]);
  },
  text: EqualSegments.text(["AD", "BC"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "DC"], 2);
  },
  text: EqualSegments.text(["AB", "DC"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CDB"]);
  },
  text: EqualAngles.text(["ABD", "CDB"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["1", "2", "3?"],
  prevStep: step3,
  text: EqualTriangles.text(["ABD", "CDB"]),
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "CBD"], props.mode);
  },
  highlight: (props: StepProps) => {
    SAS.highlight(props, {
      seg1s: { s: ["AD", "BC"] },
      seg2s: { s: ["AB", "DC"], ticks: 2 },
      angles: { a: ["BAD", "BCD"] },
      triangles: ["ABD", "CDB"],
    });
    EqualAngles.highlight(props, ["BAD", "BCD"], SVGModes.Inconsistent, 2);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["4"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"], 2);
  },
  text: EqualAngles.text(["BAD", "DCB"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "CBD"], SVGModes.ReliesOn);
  },
});

export const T1_S1_IN1: LayoutProps = {
  name: "T1_S1_IN1",
  questions: exploratoryQuestion(4, 5),
  shuffleQuestions: IN1questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5],
  title: "Prove Angles Congruent #1[M]",
};
