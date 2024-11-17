import { Content } from "../../core/diagramContent";
import { AspectRatio } from "../../core/diagramSvg/svgTypes";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/reasons/EqualAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../core/reasons/EqualTriangles";
import { Reflexive, ReflexiveStep } from "../../core/reasons/Reflexive";
import { SAS, SASProps } from "../../core/reasons/SAS";
import { SSS } from "../../core/reasons/SSS";
import {
  tutorial1Questions,
  tutorial2Questions,
} from "../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
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
  ctx.push(new Triangle({ pts: [A, C, D], hoverable, label: "ACD" }, ctx));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AB", "AD"])}
        {comma}
        {EqualAngles.staticText(["BAC", "DAC"])}
      </span>
    );
  },
  text: (isActive: boolean) => givens.staticText(),
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABC").mode(props.frame, props.mode);
    props.ctx.getTriangle("ADC").mode(props.frame, props.mode);
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  staticText: () => EqualTriangles.staticText(["ABC", "ADC"]),
  text: (isActive: boolean) => proves.staticText(),
});

const step1: StepMeta = EqualSegmentStep(["AB", "AD"], Reasons.Given, givens);

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: EqualAngles.text(["BAC", "DAC"]),
  staticText: () => EqualAngles.staticText(["BAC", "DAC"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["BAC", "DAC"]),
});

const step3: StepMeta = makeStepMeta({
  ...ReflexiveStep("AC", 2, step2),
  highlight: (ctx: Content, frame: string) =>
    Reflexive.highlight(ctx, frame, "AC", 2),
});

const step4SASProps: SASProps = {
  seg1s: { s: ["AB", "AD"], ticks: 1 },
  seg2s: { s: ["AC", "AC"], ticks: 2 },
  angles: { a: ["BAC", "DAC"], type: Obj.EqualAngleTick },
  triangles: ["ABC", "ADC"],
};
const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [1, 2, 3],
  text: EqualTriangles.text(step4SASProps.triangles),
  staticText: () => EqualTriangles.staticText(step4SASProps.triangles),
  additions: (props: StepFocusProps) => SAS.additions(props, step4SASProps),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, step4SASProps);
  },
});

// TUTORIAL 2
const step4t2 = makeStepMeta({
  ...step4,
  additions: (props: StepFocusProps) => {
    SAS.additions(props, step4SASProps);
  },
  highlight: (ctx: Content, frame: string) =>
    SSS.highlight(ctx, frame, {
      s1s: ["AB", "AD"],
      s2s: ["AC", "AC"],
      s3s: ["BC", "CD"],
    }),
  reason: Reasons.SSS,
});

export const TutorialProof1: LayoutProps = {
  name: "TutorialProof1",
  // TODO: Replace questions
  questions: tutorial1Questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4],
  title: "Prove Triangles Congruent #1a",
};

export const TutorialProof2: LayoutProps = {
  name: "TutorialProof2",
  questions: tutorial2Questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4t2],
  title: "Prove Triangles Congruent #1b [M]",
};
