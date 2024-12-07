import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { ShowPoint } from "../../../core/geometry/Point";
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
  exploratoryQuestion,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = () => {
  let ctx = new Content();
  const [Q, R, M, N, P] = ctx.addPoints([
    {
      pt: [2, 10],
      label: "Q",
      offset: [-18, -15],
      showPoint: ShowPoint.Adaptive,
    },
    { pt: [8, 5.5], label: "R", offset: [0, 8], showPoint: ShowPoint.Adaptive },
    {
      pt: [14, 5.5],
      label: "M",
      offset: [5, -8],
      showPoint: ShowPoint.Adaptive,
    },
    { pt: [14, 1], label: "N", offset: [5, 0], showPoint: ShowPoint.Adaptive },
    {
      pt: [2, 5.5],
      label: "P",
      offset: [-15, -8],
      showPoint: ShowPoint.Adaptive,
    },
  ]);

  ctx.addTriangles([
    { pts: [Q, P, R] },
    { pts: [R, M, N], rotatePattern: true },
  ]);

  // for given step:
  ctx.addAngles([
    { start: Q, center: P, end: R },
    { start: R, center: M, end: N },
  ]);

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {EqualRightAngles.text(["QPR", "RMN"])(true)}
        {comma}
        {Midpoint.text("R", "PM")(true)}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("QRP").mode(props.frame, props.mode);
    props.ctx.getTriangle("MRN").mode(props.frame, props.mode);
    EqualRightAngles.additions(props, ["QPR", "RMN"]);
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    Midpoint.additions({ ...props, mode: SVGModes.Derived }, "R", ["QR", "NR"]);
  },
  text: (active: boolean) => Midpoint.text("R", "QN")(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["QPR", "RMN"]);
  },
  text: EqualRightAngles.text(["QPR", "RMN"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
  text: Midpoint.text("R", "PM"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: ["2"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["PR", "RM"]);
  },
  text: EqualSegments.text(["PR", "RM"]),
  highlight: (props: StepProps) =>
    props.ctx.getPoint("R").mode(props.frame, SVGModes.ReliesOn),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  prevStep: step22,
  text: EqualAngles.text(["QRP", "MRN"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["QRP", "MRN"]),
  highlight: (props: StepProps) =>
    VerticalAngles.highlight(
      props,
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
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["QPR", "RMN"], props.mode);
  },
  highlight: (props: StepProps) => {
    ASA.highlight(props, {
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
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["QPR", "RMN"], SVGModes.ReliesOn);
  },
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: ["6"],
  prevStep: step5,
  text: Midpoint.text("R", "QN"),
  highlight: (props: StepProps) => {
    EqualSegments.highlight(props, ["QR", "NR"], SVGModes.ReliesOn, 2);
    props.ctx.getPoint("R").mode(props.frame, SVGModes.Derived);
  },
});

export const T1_S1_C3: LayoutProps = {
  name: "T1_S1_C3",
  questions: exploratoryQuestion(3, 7),
  shuffleQuestions: S1C3questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6],
  title: "Prove Midpoint #2",
};
