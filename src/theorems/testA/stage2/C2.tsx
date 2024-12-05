import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles, EqualAngleStep } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegments,
  EqualSegmentStep,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import {
  S2C2Questions,
  testQuestionOrder,
} from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [1, 9], // F
      [2, 1], // A
      [5.5, 6], // B
      [9, 1], // C
      [5.5, 1], // D
      [10, 9], // G
    ],
  ];
  let ctx = new Content();
  const labels = ["F", "A", "B", "C", "D", "G"];
  const offsets: Vector[] = [
    [-12, 0],
    [-10, -15],
    [-3, 10],
    [-3, -15],
    [-5, -18],
    [3, 0],
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
    new Triangle(
      { pts: [A, B, D], hoverable, label: "ABD", rotatePattern: true },
      ctx
    ),
    new Triangle({ pts: [B, C, D], hoverable, label: "BCD" }, ctx),
    new Triangle(
      { pts: [B, C, G], hoverable, label: "BCG", rotatePattern: true },
      ctx
    ),
  ].map((t) => ctx.push(t));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("AC", "BD")(isActive)}
        {comma}
        {EqualSegments.text(["AD", "DC"])(isActive)}
        {comma}
        {EqualAngles.text(["FAB", "GCB"])(isActive)}
        {comma}
        {EqualSegments.text(["AF", "CG"])(isActive)}
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
    Perpendicular.additions(props, "BD", ["AD", "CD"]);
    EqualSegments.additions(props, ["AD", "DC"]);
    EqualAngles.additions(props, ["FAB", "GCB"]);
    EqualSegments.additions(props, ["AF", "CG"], 2);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions({ ...props, mode: SVGModes.Derived }, ["AFB", "CGB"]),
  text: EqualAngles.text(["AFB", "CGB"]),
  staticText: () => EqualAngles.staticText(["AFB", "CGB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: Perpendicular.text("AC", "BD"),
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "CD"]),
  staticText: () => Perpendicular.staticText("AC", "BD"),
});

const step2: StepMeta = EqualSegmentStep(["AD", "DC"], Reasons.Given, step1);
const step3: StepMeta = EqualAngleStep(["FAB", "GCB"], Reasons.Given, step2);
const step4: StepMeta = EqualSegmentStep(["AF", "CG"], Reasons.Given, step3, 2);
const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "BD", 3);
  },
  text: Reflexive.text("BD"),
  staticText: () => Reflexive.staticText("BD"),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step5,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "BD", ["AD", "CD"], SVGModes.ReliesOn);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["2", "5", "6"],
  prevStep: step6,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["ADB", "BDC"],
      props.mode
    );
  },
  text: EqualTriangles.text(["ABD", "BCD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "BCD"]),
  highlight: (ctx: Content, frame: string) => {
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"], SVGModes.ReliesOn);
    EqualSegments.highlight(ctx, frame, ["AD", "DC"], SVGModes.ReliesOn);
    EqualSegments.highlight(ctx, frame, ["BD", "BD"], SVGModes.ReliesOn, 3);
  },
});

const step8: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["AB", "BC"], Reasons.CPCTC, step7, 4, ["7"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["ADB", "BDC"],
      SVGModes.ReliesOn
    );
  },
});
const step9: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["3", "4", "8"],
  prevStep: step8,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["FAB", "BCG"],
      props.mode
    );
  },
  text: EqualTriangles.text(["ABF", "BCG"]),
  staticText: () => EqualTriangles.staticText(["ABF", "BCG"]),
  highlight: (ctx: Content, frame: string) => {
    EqualAngles.highlight(ctx, frame, ["FAB", "BCG"], SVGModes.ReliesOn);
    EqualSegments.highlight(ctx, frame, ["FA", "GC"], SVGModes.ReliesOn, 2);
    EqualSegments.highlight(ctx, frame, ["AB", "BC"], SVGModes.ReliesOn, 4);
  },
});

const step10: StepMeta = makeStepMeta({
  ...EqualAngleStep(["AFB", "CGB"], Reasons.CPCTC, step9, 2, ["9"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["FAB", "BCG"],
      SVGModes.ReliesOn
    );
  },
});

export const T1_S2_C2: LayoutProps = {
  name: "T1_S2_C2",
  questions: testQuestionOrder(5, 10, S2C2Questions),
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
  title: "Prove Angles Congruent #2",
};
