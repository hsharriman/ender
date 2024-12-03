import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { SAS } from "../../../core/reasons/SAS";
import {
  IN1questions,
  testQuestionOrder,
} from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [1, 2], // A
      [10, 2], // D
      [5, 9], // B
      [14, 9], // C
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "D", "B", "C"];
  const offsets: Vector[] = [
    [-15, -10],
    [10, -10],
    [-25, -10],
    [3, -10],
  ];
  const pts = coords[0];
  const [A, D, B, C] = pts.map((c, i) =>
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
    new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx),
    new Triangle(
      { pts: [B, C, D], hoverable, label: "CDB", rotatePattern: true },
      ctx
    ),
  ].map((t) => ctx.push(t));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    const ADeqBC = EqualSegments.text(["AD", "BC"])(isActive);
    const ABeqDC = EqualSegments.text(["AB", "DC"])(isActive);
    const ABDeqCDB = EqualAngles.text(["ABD", "CDB"])(isActive);

    return (
      <span>
        {ADeqBC}
        {comma}
        {ABeqDC}
        {comma}
        {ABDeqCDB}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CDB").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AD", "BC"])}
        {comma}
        {EqualSegments.staticText(["AB", "DC"])}
        {comma}
        {EqualAngles.staticText(["ABD", "CDB"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions({ ...props, mode: SVGModes.Derived }, ["BAD", "DCB"]);
  },
  text: EqualAngles.text(["BAD", "DCB"]),
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "BC"]);
  },
  text: EqualSegments.text(["AD", "BC"]),
  staticText: () => EqualSegments.staticText(["AD", "BC"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "DC"], 2);
  },
  text: EqualSegments.text(["AB", "DC"]),
  staticText: () => EqualSegments.staticText(["AB", "DC"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CDB"]);
  },
  text: EqualAngles.text(["ABD", "CDB"]),
  staticText: () => EqualAngles.staticText(["ABD", "CDB"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["1", "2", "3?"],
  prevStep: step3,
  text: EqualTriangles.text(["ABD", "CDB"]),
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["ADB", "CBD"],
      props.mode
    );
  },
  staticText: () => EqualTriangles.staticText(["ABD", "CDB"]),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, {
      seg1s: { s: ["AD", "BC"] },
      seg2s: { s: ["AB", "DC"], ticks: 2 },
      angles: { a: ["BAD", "BCD"] },
      triangles: ["ABD", "CDB"],
    });
    EqualAngles.highlight(ctx, frame, ["BAD", "BCD"], SVGModes.Inconsistent, 2);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["4"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"], 2);
  },
  text: EqualAngles.text(["BAD", "DCB"]),
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["ADB", "CBD"],
      SVGModes.ReliesOn
    );
  },
});

export const T1_S1_IN1: LayoutProps = {
  name: "T1_S1_IN1",
  questions: testQuestionOrder(4, 5, IN1questions),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5],
  title: "Prove Angles Congruent #1[M]",
};
