import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { comma, segmentStr } from "../../core/geometryText";
import { CongruentTriangles } from "../../core/templates/CongruentTriangles";
import { EqualAngleStep, EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Midpoint } from "../../core/templates/Midpoint";
import { ParallelLines } from "../../core/templates/ParallelLines";
import { Perpendicular } from "../../core/templates/Perpendicular";
import { ReflexiveStep } from "../../core/templates/Reflexive";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../core/types/types";
import { completeProof1 } from "../../questions/completeQuestions";
import { Reasons } from "../reasons";
import { linked, makeStepMeta } from "../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [0, 4], // F
      [1, 0], // A
      [2.5, 3], // B
      [4, 0], // C
      [2.5, 0], // D
      [5, 4], // G
    ],
  ];
  let ctx = new Content();
  const labels = ["F", "A", "B", "C", "D", "G"];
  const offsets: Vector[] = [
    [-15, 0],
    [5, -3],
    [-17, -17],
    [3, -10],
    [10, -5],
    [0, 0],
  ];
  const pts = coords[0];
  const [F, A, B, C, D, G] = pts.map((c, i) =>
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

  [
    new Triangle({ pts: [A, B, F], hoverable, label: "ABF" }, ctx),
    new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx),
    new Triangle({ pts: [B, C, D], hoverable, label: "BCD" }, ctx),
    new Triangle({ pts: [B, C, G], hoverable, label: "BCG" }, ctx),
  ].map((t) => ctx.push(t));

  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (ctx: Content) => {
    return (
      <span>
        {Perpendicular.text(ctx, "AC", ["AD", "CD"], "BD")}
        {comma}
        {EqualSegments.text(ctx, ["AD", "DC"])}
        {comma}
        {EqualAngles.text(ctx, ["FAB", "GCB"])}
        {comma}
        {EqualSegments.text(ctx, ["AF", "CG"])}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {Perpendicular.staticText("AC", "BD")}
        {comma}
        {EqualSegments.staticText(["AD", "DC"])}
        {comma}
        {EqualAngles.staticText(["FAB", "GCB"])}
        {comma}
        {EqualSegments.staticText(["AF", "CG"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABF").mode(props.frame, props.mode);
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCG").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["AFB", "CGB"]),
  text: (ctx: Content) => EqualAngles.text(ctx, ["AFB", "CGB"]),
  staticText: () => EqualAngles.staticText(["AFB", "CGB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (ctx: Content) => Perpendicular.text(ctx, "AC", ["AD", "CD"], "BD"),
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "CD"]),
  staticText: () => Perpendicular.staticText("AC", "BD"),
});

const step2: StepMeta = EqualSegmentStep(["AD", "DC"], Reasons.Given, step1);
const step3: StepMeta = EqualAngleStep(["FAB", "GCB"], Reasons.Given, step2);
const step4: StepMeta = EqualSegmentStep(["AF", "CG"], Reasons.Given, step3, 2);
const step5: StepMeta = ReflexiveStep("BD", 3, step4);

const step6: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: (ctx: Content) => EqualRightAngles.text(ctx, ["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 5, 6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step2.additions(props);
    step5.additions(props);
    step6.additions(props);

    props.ctx.getSegment("AB").mode(props.frame, props.mode);
    props.ctx.getSegment("CB").mode(props.frame, props.mode);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABD", "BCD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "BCD"]),
});

const step8: StepMeta = EqualSegmentStep(
  ["AB", "BC"],
  Reasons.CorrespondingSegments,
  step7,
  4,
  [7]
);
const step9: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [3, 4, 8],
  unfocused: (props: StepUnfocusProps) => {
    step8.additions({ ...props, mode: SVGModes.Unfocused });
    step8.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step3.additions(props);
    step4.additions(props);
    step8.additions(props);
    props.ctx.getSegment("FB").mode(props.frame, props.mode);
    props.ctx.getSegment("GB").mode(props.frame, props.mode);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABF", "BCG"]),
  staticText: () => EqualTriangles.staticText(["ABF", "BCG"]),
});

const step10: StepMeta = EqualAngleStep(
  ["AFB", "CGB"],
  Reasons.CorrespondingAngles,
  step9,
  2,
  [9]
);

const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };

  // // // STEP 4 - VERTICAL ANGLES
  // const step4 = ctx.addFrame("s5");
  // ctx.getTriangle("MYZ").mode(step4, SVGModes.Focused);
  // ctx.getTriangle("MWX").mode(step4, SVGModes.Focused);
  // ctx.getSegment("WX").mode(step4, SVGModes.Hidden);
  // ctx.getSegment("YZ").mode(step4, SVGModes.Hidden);
  // EqualAngles.additions(
  //   { ...defaultStepProps, frame: step4 },
  //   ["WMX", "YMZ"],
  //   1,
  //   SVGModes.Blue
  // );

  // // // STEP 5 - SAS TRIANGLE CONGRUENCE
  // const step5 = ctx.addFrame("s6");
  // SAS.additions(
  //   { ...defaultStepProps, frame: step5 },
  //   {
  //     seg1s: { s: ["WM", "MZ"], ticks: 1 },
  //     seg2s: { s: ["XM", "YM"], ticks: 2 },
  //     angles: { a: ["WMX", "YMZ"] },
  //     triangles: ["MWX", "MYZ"],
  //   },
  //   SVGModes.Blue
  // );

  // // // STEP 6 - CORRESPONDING ANGLES
  // const step6 = ctx.addFrame("s7");
  // CongruentTriangles.additions(
  //   { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
  //   {
  //     s1s: ["WM", "MZ"],
  //     s2s: ["XM", "YM"],
  //     s3s: ["WX", "YZ"],
  //     a1s: ["WMX", "YMZ"],
  //     a2s: ["MXW", "MYZ"],
  //     a3s: ["MWX", "MZY"],
  //   }
  // );
  // EqualAngles.additions(
  //   { ...defaultStepProps, frame: step6 },
  //   ["MXW", "MYZ"],
  //   2,
  //   SVGModes.Blue
  // );

  // // // STEP 7 - ALTERNATE ANGLES
  // const step7 = ctx.addFrame("s8");
  // ctx.getSegment("YM").mode(step7, SVGModes.Focused);
  // ctx.getSegment("XM").mode(step7, SVGModes.Focused);
  // EqualAngles.additions(
  //   { ...defaultStepProps, mode: SVGModes.Focused, frame: step7 },
  //   ["MYZ", "MXW"]
  // );
  // ParallelLines.additions(
  //   { ...defaultStepProps, frame: step7 },
  //   ["WX", "YZ"],
  //   1,
  //   SVGModes.Blue
  // );

  return ctx;
};

export const P6: LayoutProps = {
  questions: completeProof1,
  miniContent: miniContent(),
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
};
