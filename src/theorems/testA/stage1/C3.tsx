import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { ASA } from "../../../core/reasons/ASA";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { VerticalAngles } from "../../../core/reasons/VerticalAngles";
import {
  S1C3questions,
  testQuestionOrder,
} from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 10], //Q
      [8, 5.5], //R
      [14, 5.5], //M
      [14, 1], //N
      [2, 5.5], //P
    ],
  ];
  let ctx = new Content();
  const labels = ["Q", "R", "M", "N", "P"];
  const offsets: Vector[] = [
    [-18, -15],
    [0, 5],
    [5, -8],
    [5, 0],
    [-15, -8],
  ];
  const pts = coords[0];
  const [Q, R, M, N, P] = pts.map((c, i) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        hoverable,
        showPoint: true,
      })
    )
  );

  ctx.push(new Triangle({ pts: [Q, P, R], hoverable, label: "QPR" }, ctx));
  ctx.push(
    new Triangle(
      { pts: [R, M, N], hoverable, label: "RMN", rotatePattern: true },
      ctx
    )
  );

  // for given step:
  ctx.push(new Angle({ start: Q, center: P, end: R, hoverable }));
  ctx.push(new Angle({ start: R, center: M, end: N, hoverable }));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (isActive: boolean) => {
    const PeqM = EqualRightAngles.text(["QPR", "RMN"])(isActive);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.text("R", "PM")(isActive)}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("QRP").mode(props.frame, props.mode);
    props.ctx.getTriangle("MRN").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {EqualRightAngles.staticText(["QPR", "RMN"])}
        {comma}
        {Midpoint.staticText("R", "PM")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    Midpoint.additions({ ...props, mode: SVGModes.Derived }, "R", ["QR", "NR"]);
  },
  text: Midpoint.text("R", "QN"),
  staticText: () => Midpoint.staticText("R", "QN"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["QPR", "RMN"]);
  },
  text: EqualRightAngles.text(["QPR", "RMN"]),
  staticText: () => EqualRightAngles.staticText(["QPR", "RMN"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
  text: Midpoint.text("R", "PM"),
  staticText: () => Midpoint.staticText("R", "PM"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: ["2"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
  text: EqualSegments.text(["PR", "RM"]),
  staticText: () => EqualSegments.staticText(["PR", "RM"]),
  highlight: (ctx: Content, frame: string) =>
    ctx.getPoint("R").mode(frame, SVGModes.ReliesOnPoint),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  prevStep: step22,
  text: EqualAngles.text(["QRP", "MRN"]),
  staticText: () => EqualAngles.staticText(["QRP", "MRN"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["QRP", "MRN"]),
  highlight: (ctx: Content, frame: string) =>
    VerticalAngles.highlight(
      ctx,
      frame,
      {
        angs: ["QRP", "MRN"],
        segs: ["QR", "RN"],
      },
      ["PR", "RM"]
    ),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["1", "3", "4"],
  prevStep: step3,
  text: EqualTriangles.text(["QPR", "RMN"]),
  staticText: () => EqualTriangles.staticText(["QPR", "RMN"]),
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["QPR", "RMN"],
      props.mode
    );
  },
  highlight: (ctx: Content, frame: string) => {
    ASA.highlight(ctx, frame, {
      a1s: { a: ["QRP", "MRN"], type: Obj.EqualAngleTick },
      a2s: { a: ["QPR", "RMN"], type: Obj.RightTick },
      segs: { s: ["PR", "RM"], ticks: 1 },
      triangles: ["QPR", "RMN"],
    });
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["5"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["QR", "RN"], 2);
  },
  text: EqualSegments.text(["QR", "RN"]),
  staticText: () => EqualSegments.staticText(["QR", "RN"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["QPR", "RMN"],
      SVGModes.ReliesOn
    );
  },
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: ["6"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["QR", "NR"], 2);
  },
  text: Midpoint.text("R", "QN"),
  staticText: () => Midpoint.staticText("R", "QN"),
  highlight: (ctx: Content, frame: string) => {
    EqualSegments.highlight(ctx, frame, ["QR", "NR"], SVGModes.ReliesOn, 2);
  },
});

export const T1_S1_C3: LayoutProps = {
  name: "T1_S1_C3",
  questions: testQuestionOrder(3, 7, S1C3questions),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6],
  title: "Prove Midpoint #2",
};
