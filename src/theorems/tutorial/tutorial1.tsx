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
  text: (isActive: boolean) => {
    return (
      <span>
        {EqualSegments.text(["AB", "AD"])(isActive)}
        {comma}
        {EqualAngles.text(["BAC", "DAC"])(isActive)}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AB", "AD"])}
        {comma}
        {EqualAngles.staticText(["BAC", "DAC"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABC").mode(props.frame, props.mode);
    props.ctx.getTriangle("ADC").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  text: EqualTriangles.text(["ABC", "ADC"]),
  staticText: () => EqualTriangles.staticText(["ABC", "ADC"]),
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

const step3: StepMeta = ReflexiveStep("AC", 2, step2);

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
});

const miniContent = () => {
  let ctx = baseContent(false, false);

  // STEP 3 - REFLEXIVE PROPERTY
  const s3 = ctx.addFrame("s3");
  Reflexive.additions({ ctx, frame: s3, mode: SVGModes.Purple }, "AC");

  // STEP 4 - SAS
  const s4 = ctx.addFrame("s4");
  SAS.additions({ ctx, frame: s4, mode: SVGModes.Purple }, step4SASProps);

  return ctx;
};

// TUTORIAL 2
const step4t2 = {
  ...step4,
  reason: Reasons.SSS,
};

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
