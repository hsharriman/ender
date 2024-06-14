import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Reflexive } from "../../core/templates/Reflexive";
import { RightAngle } from "../../core/templates/RightAngle";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { checkingProof2 } from "../../questions/checkingQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [1, 4],
      [5, 4],
      [3, 0],
      [3, 4],
    ],
  ];
  let ctx = new Content();
  const labels = ["J", "L", "K", "M"];
  const offsets: Vector[] = [
    [-15, -15],
    [8, -15],
    [-5, -17],
    [-5, 6],
  ];
  const pts = coords[0];
  const [J, L, K, M] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [J, M, K], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [L, M, K], parentFrame }, ctx));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    return (
      <span>
        {RightAngle.text(props, "JMK")}
        {comma}
        {EqualSegments.text(props, ["JK", "LK"])}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    return (
      <span>
        {RightAngle.ticklessText(ctx, "JMK")}
        {comma}
        {EqualSegments.ticklessText(ctx, ["JK", "LK"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("JMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
  staticText: () => {
    return (
      <span>
        {RightAngle.staticText("JMK")}
        {comma}
        {EqualSegments.staticText(["JK", "LK"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  text: (props: StepTextProps) => {
    return EqualTriangles.text(props, ["JMK", "LMK"]);
  },
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "JMK");
  },
  text: (props: StepTextProps) => {
    return RightAngle.text(props, "JMK");
  },
  staticText: () => RightAngle.staticText("JMK"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    const focusProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(focusProps);
    step1.additions(focusProps);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["JK", "LK"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["JK", "LK"]);
  },
  staticText: () => EqualSegments.staticText(["JK", "LK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["JMK", "LMK"]);
  },
  text: (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["JMK", "LMK"]);
  },
  staticText: () => EqualRightAngles.staticText(["JMK", "LMK"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: (props: StepTextProps) => {
    return Reflexive.text(props, "MK", 2);
  },
  staticText: () => Reflexive.staticText("MK"),
});

const step5Labels: SASProps = {
  seg1s: { s: ["JK", "LK"], ticks: 1 },
  seg2s: { s: ["MK", "MK"], ticks: 2 },
  angles: { a: ["JMK", "LMK"], type: Obj.RightTick },
  triangles: ["JMK", "LMK"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 3, 4],
  additions: (props: StepFocusProps) => {
    SAS.additions(props, step5Labels);
  },
  text: (props: StepTextProps) => {
    return SAS.text(props, step5Labels);
  },
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
});

export const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };
  // STEP 3 - PERPENDICULAR LINES
  const step3 = ctx.addFrame("s3");
  ctx.getSegment("JM").mode(step3, SVGModes.Focused);
  ctx.getSegment("LM").mode(step3, SVGModes.Focused);
  ctx.getSegment("MK").mode(step3, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["JMK", "LMK"],
    SVGModes.Blue
  );

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s4");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "MK", 1);

  // STEP 4 - SAS CONGRUENCE
  const step5 = ctx.addFrame("s5");
  SAS.additions(
    { ...defaultStepProps, frame: step5 },
    {
      seg1s: { s: ["MK", "MK"], ticks: 1 },
      seg2s: { s: ["JM", "LM"], ticks: 2 },
      angles: { a: ["JMK", "LMK"], type: Obj.RightTick },
      triangles: ["JMK", "LMK"],
    },
    SVGModes.Blue
  );
  return ctx;
};

export const PC2: LayoutProps = {
  questions: checkingProof2,
  baseContent,
  steps: [step1, step2, step3, step4, step5],
  miniContent: miniContent(),
  givens,
  proves,
};
