import { Content } from "../../core/diagramContent";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { CongruentTriangles } from "../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../core/reasons/EqualAngles";
import { EqualSegments } from "../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../core/reasons/EqualTriangles";
import { Reflexive } from "../../core/reasons/Reflexive";
import { SAS, SASProps } from "../../core/reasons/SAS";
import { SSS } from "../../core/reasons/SSS";
import {
  tutorial1Questions,
  tutorial2Questions,
} from "../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [5.5, 9], //A
      [2, 3], //B
      [5.5, 1], //C
      [9, 3], //D
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D"];
  const offsets: Vector[] = [
    [0, 5],
    [-8, -18],
    [-8, -17],
    [-5, -18],
  ];
  const pts = coords[0];
  const [A, B, C, D] = pts.map((c, i) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        hoverable,
      })
    )
  );

  ctx.push(new Triangle({ pts: [A, B, C], hoverable, label: "ABC" }, ctx));
  ctx.push(
    new Triangle(
      { pts: [A, C, D], hoverable, label: "ACD", rotatePattern: true },
      ctx
    )
  );

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {EqualSegments.text(["AB", "AD"])(true)}
        {comma}
        {EqualAngles.text(["BAC", "DAC"])(true)}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABC").mode(props.frame, props.mode);
    props.ctx.getTriangle("ADC").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["AB", "AD"], 1);
    EqualAngles.additions(props, ["BAC", "DAC"]);
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) =>
    CongruentTriangles.congruentLabel(props, ["ABC", "ADC"], SVGModes.Derived),
  prevStep: givens,
  text: (active: boolean) => EqualTriangles.text(["ABC", "ADC"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "AD"], 1);
  },
  text: EqualSegments.text(["AB", "AD"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  text: EqualAngles.text(["BAC", "DAC"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["BAC", "DAC"]),
});

const step3 = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "AC", 2);
  },
  text: Reflexive.text("AC"),
});

const step4SASProps: SASProps = {
  seg1s: { s: ["AB", "AD"], ticks: 1 },
  seg2s: { s: ["AC", "AC"], ticks: 2 },
  angles: { a: ["BAC", "DAC"], type: Obj.EqualAngleTick },
  triangles: ["ABC", "ADC"],
};
const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["1", "2", "3"],
  prevStep: step3,
  text: EqualTriangles.text(step4SASProps.triangles),
  additions: (props: StepFocusProps) =>
    CongruentTriangles.congruentLabel(props, ["ABC", "ADC"], props.mode),
  highlight: (props: StepProps) => {
    SAS.highlight(props, step4SASProps);
  },
});

// TUTORIAL 2
const step4t2 = makeStepMeta({
  ...step4,
  dependsOn: ["1", "2", "3?"],
  prevStep: step3,
  highlight: (props: StepProps) => {
    SSS.highlight(props, {
      s1s: ["AB", "AD"],
      s2s: ["AC", "AC"],
      s3s: ["BC", "CD"],
    });
    EqualSegments.highlight(props, ["BC", "CD"], SVGModes.Inconsistent, 3);
  },
  reason: Reasons.SSS,
});

export const TutorialProof1: LayoutProps = {
  name: "TutorialProof1",
  // TODO: Replace questions
  questions: tutorial1Questions,
  shuffleQuestions: [],
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4],
  title: "Prove Triangles Congruent #1a",
};

export const TutorialProof2: LayoutProps = {
  name: "TutorialProof2",
  questions: tutorial2Questions,
  shuffleQuestions: [],
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4t2],
  title: "Prove Triangles Congruent #1b [M]",
};
