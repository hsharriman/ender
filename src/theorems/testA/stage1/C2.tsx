import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, segmentStr } from "../../../core/geometryText";
import { ASA, ASAProps } from "../../../core/reasons/ASA";
import { BaseAngle } from "../../../core/reasons/BaseAngle";
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
  testQuestionOrder,
} from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { BGColors, makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 1], // A
      [5.5, 8], // B
      [9, 1], // C
      [5.5, 1], // D
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D"];
  const offsets: Vector[] = [
    [-15, -15],
    [0, 5],
    [0, -17],
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
        showPoint: true,
      })
    )
  );

  ctx.push(new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx));
  ctx.push(new Triangle({ pts: [C, B, D], hoverable, label: "CBD" }, ctx));

  // for given step:
  ctx.push(new Angle({ start: A, center: B, end: C, hoverable }));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {RightAngle.text("ADB")(isActive)}
        {comma}
        {segmentStr("BD")}
        <span className="font-notoSans">&nbsp;bisects&nbsp;</span>
        {BaseAngle.text("ABC", BGColors.Blue)(isActive)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {RightAngle.staticText("ADB")}
        {comma}
        {segmentStr("BD")}
        {" bisects "}
        {angleStr("ABC")}
      </span>
    );
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
  text: Midpoint.text("D", "AC"),
  staticText: () => Midpoint.staticText("D", "AC"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "ADB");
  },
  text: RightAngle.text("ADB"),
  staticText: () => RightAngle.staticText("ADB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("BD").mode(props.frame, props.mode);
    EqualAngles.additions(props, ["ABD", "CBD"]);
  },
  text: (isActive: boolean) => {
    return step2.staticText();
  },
  staticText: () => (
    <span>
      {segmentStr("BD")} bisects {angleStr("ABC")}
    </span>
  ),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: ["1"],
  prevStep: step2,
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "DC"]),
  text: Perpendicular.text("AC", "BD"),
  staticText: () => Perpendicular.staticText("BD", "AC"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["3"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "BD", ["AD", "DC"], SVGModes.ReliesOn);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => Reflexive.additions(props, "BD"),
  text: Reflexive.text("BD"),
  staticText: () => Reflexive.staticText("BD"),
});

const step5ASAProps: ASAProps = {
  a1s: { a: ["ADB", "BDC"], type: Obj.RightTick },
  a2s: { a: ["ABD", "CBD"], type: Obj.EqualAngleTick },
  segs: { s: ["BD", "BD"] },
  triangles: ["ABD", "CBD"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["2", "4", "5"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["ADB", "BDC"],
      props.mode
    );
  },
  text: EqualTriangles.text(["ABD", "CBD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "CBD"]),
  highlight: (ctx: Content, frame: string) => {
    ASA.highlight(ctx, frame, step5ASAProps, SVGModes.ReliesOn);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  prevStep: step6,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: EqualSegments.text(["AD", "DC"]),
  staticText: () => EqualSegments.staticText(["AD", "DC"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["ADB", "BDC"],
      SVGModes.ReliesOn
    );
  },
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: ["7"],
  prevStep: step7,
  additions: (props: StepFocusProps) => {
    props.ctx.getPoint("D").mode(props.frame, SVGModes.Derived);
  },
  text: Midpoint.text("D", "AC"),
  staticText: () => Midpoint.staticText("D", "AC"),
  highlight: (ctx: Content, frame: string) => {
    EqualSegments.highlight(ctx, frame, ["AD", "DC"], SVGModes.ReliesOn, 2);
    ctx.getPoint("D").mode(frame, SVGModes.Derived);
  },
});

export const T1_S1_C2: LayoutProps = {
  name: "T1_S1_C2",
  questions: testQuestionOrder(3, 8, S1C2questions),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Prove Midpoint #1",
};
