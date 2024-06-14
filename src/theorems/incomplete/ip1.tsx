import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/templates/EqualSegments";
import { Reflexive, ReflexiveStep } from "../../core/templates/Reflexive";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../core/types/types";
import { incompleteProof1 } from "../../questions/incompleteQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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
        parentFrame: parentFrame,
      })
    )
  );

  ctx.push(new Triangle({ pts: [A, B, C], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [A, C, D], parentFrame }, ctx));

  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    return (
      <span>
        {EqualSegments.text(props, ["AB", "AD"])}
        {comma}
        {EqualSegments.text(props, ["BC", "DC"], 2)}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    return (
      <span>
        {EqualSegments.ticklessText(ctx, ["AB", "AD"])}
        {comma}
        {EqualSegments.ticklessText(ctx, ["BC", "DC"])}
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
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAC", "DAC"]);
  },
  text: (props: StepTextProps) => EqualAngles.text(props, ["BAC", "DAC"]),
  staticText: () => EqualAngles.staticText(["BAC", "DAC"]),
});

const step1: StepMeta = EqualSegmentStep(["AB", "AD"], Reasons.Given, givens);

const step2: StepMeta = EqualSegmentStep(["BC", "DC"], Reasons.Given, step1, 2);

const step3: StepMeta = ReflexiveStep("AC", 3, step2);

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (props: StepTextProps) => (
    <span style={{ color: "black", fontStyle: "italic" }}>
      Which step can be applied here?
    </span>
  ),
  staticText: () => (
    <span style={{ fontStyle: "italic" }}>Which step can be applied here?</span>
  ),
});

// const step5: StepMeta = makeStepMeta({
//   reason: Reasons.Empty,
//   unfocused: (props: StepUnfocusProps) => {
//     step3.unfocused(props);
//     step3.additions({ ...props, mode: SVGModes.Unfocused });
//   },
// });

const miniContent = () => {
  let ctx = baseContent(false);

  // STEP 3 - REFLEXIVE PROPERTY
  const s3 = ctx.addFrame("s3");
  Reflexive.additions(
    { ctx, frame: s3, mode: SVGModes.Purple, inPlace: true },
    "AC"
  );

  return ctx;
};

export const IP1: LayoutProps = {
  questions: incompleteProof1,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4],
};
