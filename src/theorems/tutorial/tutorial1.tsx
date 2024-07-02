import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Reflexive, ReflexiveStep } from "../../core/templates/Reflexive";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { placeholder } from "../../questions/funcTypeQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 4], //A
      [0, 1], //B
      [2, 0], //C
      [4, 1], //D
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

  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (ctx: Content) => {
    return (
      <span>
        {EqualSegments.text(ctx, ["AB", "AD"])}
        {comma}
        {EqualSegments.text(ctx, ["BC", "DC"])}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AB", "AD"])}
        {comma}
        {EqualSegments.staticText(["BC", "DC"])}
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
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABC", "ADC"]),
  staticText: () => EqualTriangles.staticText(["ABC", "ADC"]),
});

const step1: StepMeta = EqualSegmentStep(["AB", "AD"], Reasons.Given, givens);

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (ctx: Content) => EqualAngles.text(ctx, ["BAC", "DAC"]),
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
  text: (ctx: Content) => EqualTriangles.text(ctx, step4SASProps.triangles),
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
  SAS.additions(
    { ctx, frame: "s4", mode: SVGModes.Purple },
    step4SASProps,
    SVGModes.Blue
  );

  return ctx;
};

export const TutorialProof1: LayoutProps = {
  name: "TutorialProof1",
  // TODO: Replace questions
  questions: placeholder,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4],
};
