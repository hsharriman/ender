import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { ASA, ASAProps } from "../../../core/reasons/ASA";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngleStep, EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import {
  S2IN1Questions,
  testQuestionOrder,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 1], // L
      [6, 1], //S
      [10, 1], // U
      [6, 2.85], //R
      [3.5, 4], //N
      [8.5, 4], //Q
      [6, 9], //P
    ],
  ];
  let ctx = new Content();
  const labels = ["L", "S", "U", "R", "N", "Q", "P"];
  const offsets: Vector[] = [
    [-15, -15],
    [-5, -18],
    [0, -17],
    [6, 12],
    [-16, 0],
    [5, 5],
    [8, -10],
  ];
  const pts = coords[0];
  const [L, S, U, R, N, Q, P] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [L, P, S], hoverable, label: "LPS" }, ctx));
  ctx.push(
    new Triangle(
      { pts: [U, P, S], hoverable, label: "UPS", rotatePattern: true },
      ctx
    )
  );
  ctx.push(
    new Triangle(
      { pts: [L, N, U], hoverable, label: "LNU", rotatePattern: true },
      ctx
    )
  );
  ctx.push(new Triangle({ pts: [U, Q, L], hoverable, label: "UQL" }, ctx));

  // for ASA at the end
  // ctx.push(new Angle({ start: L, center: N, end: U, hoverable }));
  // ctx.push(new Angle({ start: U, center: Q, end: N, hoverable }));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("LU", "PS")(isActive)}
        {comma}
        {EqualSegments.text(["LN", "QU"])(isActive)}
        {comma}
        {EqualAngles.text(["LPS", "UPS"])(isActive)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LPS").mode(props.frame, props.mode);
    props.ctx.getTriangle("LNU").mode(props.frame, props.mode);
    props.ctx.getTriangle("UQL").mode(props.frame, props.mode);
    props.ctx.getTriangle("UPS").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {Perpendicular.staticText("PS", "LU")}
        {comma}
        {EqualSegments.staticText(["LN", "QU"])}
        {comma}
        {EqualAngles.staticText(["LPS", "UPS"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["LNU", "UQL"],
      SVGModes.Derived
    );
    props.ctx.getTriangle("LNU").mode(props.frame, SVGModes.Derived);
    props.ctx.getTriangle("UQL").mode(props.frame, SVGModes.Derived);
  },
  text: EqualTriangles.text(["LNU", "UQL"]),
  staticText: () => EqualTriangles.staticText(["LNU", "UQL"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "PS", ["LS", "SU"]),
  text: Perpendicular.text("LU", "PS"),
  staticText: () => Perpendicular.staticText("PS", "LU"),
});

const step2: StepMeta = EqualSegmentStep(["LN", "QU"], Reasons.Given, step1);

const step3: StepMeta = EqualAngleStep(["LPS", "UPS"], Reasons.Given, step2);

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["PSL", "PSU"]),
  text: EqualRightAngles.text(["PSL", "PSU"]),
  staticText: () => EqualRightAngles.staticText(["PSL", "PSU"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "PS", ["LS", "SU"], SVGModes.ReliesOn);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "PS", 2);
  },
  text: Reflexive.text("PS"),
  staticText: () => Reflexive.staticText("PS"),
});

const step6ASAProps: ASAProps = {
  a1s: { a: ["PSL", "PSU"], type: Obj.RightTick },
  a2s: { a: ["LPS", "UPS"], type: Obj.EqualAngleTick },
  segs: { s: ["PS", "PS"], ticks: 2 },
  triangles: ["LSP", "USP"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["3", "4", "5"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["LSP", "USP"],
      props.mode
    );
  },
  text: EqualTriangles.text(step6ASAProps.triangles),
  staticText: () => EqualTriangles.staticText(step6ASAProps.triangles),
  highlight: (ctx: Content, frame: string) => {
    ASA.highlight(ctx, frame, step6ASAProps);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  unfocused: (props: StepUnfocusProps) => {
    // step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["SLP", "SUP"], 2);
  },
  text: EqualAngles.text(["SLP", "SUP"]),
  staticText: () => EqualAngles.staticText(["SLP", "SUP"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["LSP", "USP"],
      SVGModes.ReliesOn
    );
  },
});

const step9ASAProps: ASAProps = {
  a1s: { a: ["ULN", "LUQ"], type: Obj.EqualAngleTick, ticks: 2 },
  a2s: { a: ["LNU", "UQL"], type: Obj.EqualAngleTick, ticks: 3 },
  segs: { s: ["LN", "QU"] },
  triangles: ["LNU", "UQL"],
};
// INCORRECT VERSION -- Correct would be reflexive LU
const step8: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6?"],
  prevStep: step7,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["LNU", "UQL"], 3);
  },
  text: EqualAngles.text(["LNU", "UQL"]),
  staticText: () => EqualAngles.staticText(["LNU", "UQL"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["LNU", "UQL"],
      SVGModes.Inconsistent
    );
  },
});

// INCORRECT VERSION -- Correct would be SAS
const step9: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["2", "7", "8"],
  prevStep: step8,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["LNU", "UQL"],
      props.mode
    );
  },
  text: EqualTriangles.text(step9ASAProps.triangles),
  staticText: () => EqualTriangles.staticText(step9ASAProps.triangles),
  highlight: (ctx: Content, frame: string) => {
    ASA.highlight(ctx, frame, step9ASAProps);
  },
});

export const T1_S2_IN1: LayoutProps = {
  name: "T1_S2_IN1",
  questions: testQuestionOrder(4, 9, S2IN1Questions),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8, step9],
  title: "Triangle Congruence #3 [M]",
};
