import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { ShowPoint } from "../../../core/geometry/Point";
import { angleStr, comma, segmentStr } from "../../../core/geometryText";
import { ASA, ASAProps } from "../../../core/reasons/ASA";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { RightAngle } from "../../../core/reasons/RightAngle";
import {
  S1C2questions,
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
  const [A, B, C, D] = ctx.addPoints([
    {
      pt: [2, 1],
      label: "A",
      offset: [-15, -15],
      showPoint: ShowPoint.Adaptive,
    },
    { pt: [5.5, 8], label: "B", offset: [0, 5], showPoint: ShowPoint.Adaptive },
    { pt: [9, 1], label: "C", offset: [0, -17], showPoint: ShowPoint.Adaptive },
    {
      pt: [5.5, 1],
      label: "D",
      offset: [-5, -18],
      showPoint: ShowPoint.Adaptive,
    },
  ]);

  ctx.addTriangles([
    { pts: [A, B, D] },
    { pts: [C, B, D], rotatePattern: true },
  ]);

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {RightAngle.text("ADB")(true)}
        {comma}
        {segmentStr("BD", true)}
        {" bisects "}
        {angleStr("ABC")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
    RightAngle.additions(props, "ADB");
    EqualAngles.additions(props, ["ABD", "CBD"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(
      { ...props, mode: SVGModes.Derived },
      "D",
      ["AD", "CD"],
      1
    );
  },
  text: (active: boolean) => Midpoint.text("D", "AC")(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "ADB");
  },
  text: RightAngle.text("ADB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("BD").mode(props.frame, props.mode);
    EqualAngles.additions(props, ["ABD", "CBD"]);
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {segmentStr("BD", isActive)} bisects {angleStr("ABC")}
      </span>
    );
  },
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Bisector,
  prevStep: step2,
  dependsOn: ["2"],
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["ABD", "DBC"]),
  text: EqualAngles.text(["ABD", "DBC"]),
  highlight: (props: StepProps) =>
    props.ctx.getSegment("BD").mode(props.frame, SVGModes.ReliesOn),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: ["1"],
  prevStep: step22,
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "DC"]),
  text: Perpendicular.text("AC", "BD"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["4"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  highlight: (props: StepProps) => {
    Perpendicular.highlight(props, "BD", ["AD", "DC"], SVGModes.ReliesOn);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => Reflexive.additions(props, "BD"),
  text: Reflexive.text("BD"),
});

const step5ASAProps: ASAProps = {
  a1s: { a: ["ADB", "BDC"], type: Obj.RightTick },
  a2s: { a: ["ABD", "CBD"], type: Obj.EqualAngleTick },
  segs: { s: ["BD", "BD"] },
  triangles: ["ABD", "CBD"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["3", "5", "6"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "BDC"], props.mode);
  },
  text: EqualTriangles.text(["ABD", "CBD"]),
  highlight: (props: StepProps) => {
    ASA.highlight(props, step5ASAProps, SVGModes.ReliesOn);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["7"],
  prevStep: step6,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: EqualSegments.text(["AD", "DC"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["ADB", "BDC"], SVGModes.ReliesOn);
  },
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: ["8"],
  prevStep: step7,
  additions: (props: StepFocusProps) => {
    props.ctx.getPoint("D").mode(props.frame, SVGModes.Derived);
  },
  text: Midpoint.text("D", "AC"),
  highlight: (props: StepProps) => {
    EqualSegments.highlight(props, ["AD", "DC"], SVGModes.ReliesOn, 2);
    props.ctx.getPoint("D").mode(props.frame, SVGModes.Derived);
  },
});

export const T1_S1_C2: LayoutProps = {
  name: "T1_S1_C2",
  questions: exploratoryQuestion(3, 8),
  shuffleQuestions: S1C2questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6, step7, step8],
  title: "Prove Midpoint #1",
};
