import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, segmentStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { ParallelLines } from "../../../core/reasons/ParallelLines";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { VerticalAngles } from "../../../core/reasons/VerticalAngles";
import {
  S1C1questions,
  exploratoryQuestion,
} from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [5, 9], // A
      [10, 2], // B
      [1, 3], // C
      [14, 8], // D
      [7.5, 5.5], // M
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D", "M"];
  const offsets: Vector[] = [
    [5, 5],
    [10, -10],
    [-20, -20],
    [3, 3],
    [0, 10],
  ];
  const pts = coords[0];
  const [A, B, C, D, M] = pts.map((c, i) =>
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
    new Triangle({ pts: [A, C, M], hoverable, label: "ACM" }, ctx),
    new Triangle(
      { pts: [B, D, M], hoverable, label: "BDM", rotatePattern: true },
      ctx
    ),
  ].map((t) => ctx.push(t));

  ctx.push(new Segment({ p1: A, p2: B, hoverable: false }));
  ctx.push(new Segment({ p1: C, p2: D, hoverable: false }));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return givens.staticText();
  },
  staticText: () => {
    return (
      <span>
        {segmentStr("AB")}
        {" and "}
        {segmentStr("CD")}
        {" intersect at point M"}
        {comma}
        {EqualSegments.staticText(["AM", "BM"])}
        {comma}
        {EqualSegments.staticText(["CM", "DM"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ACM").mode(props.frame, props.mode);
    props.ctx.getTriangle("BDM").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["AM", "BM"]);
    EqualSegments.additions(props, ["CM", "DM"], 2);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    ParallelLines.additions({ ...props, mode: SVGModes.Derived }, ["AC", "BD"]);
  },
  text: (isActive: boolean) => proves.staticText(),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: (isActive: boolean) => {
    return step1.staticText();
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("AM").mode(props.frame, props.mode);
    props.ctx.getSegment("BM").mode(props.frame, props.mode);
    props.ctx.getSegment("CM").mode(props.frame, props.mode);
    props.ctx.getSegment("DM").mode(props.frame, props.mode);
  },
  staticText: () => {
    return (
      <span>
        {segmentStr("AB")}
        {" and "}
        {segmentStr("CD")}
        {" intersect at point M"}
      </span>
    );
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AM", "BM"]),
  text: EqualSegments.text(["AM", "BM"]),
  staticText: () => EqualSegments.staticText(["AM", "BM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step2,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["CM", "DM"], 2),
  text: EqualSegments.text(["CM", "DM"]),
  staticText: () => EqualSegments.staticText(["CM", "DM"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CMA", "DMB"]),
  text: EqualAngles.text(["CMA", "DMB"]),
  staticText: () => EqualAngles.staticText(["CMA", "DMB"]),
  highlight: (ctx: Content, frame: string) =>
    VerticalAngles.highlight(
      ctx,
      frame,
      {
        angs: ["CMA", "DMB"],
        segs: ["AM", "BM"],
      },
      ["CM", "DM"]
    ),
});

const step4SASProps: SASProps = {
  seg1s: { s: ["AM", "BM"], ticks: 1 },
  seg2s: { s: ["CM", "DM"], ticks: 2 },
  angles: { a: ["CMA", "DMB"] },
  triangles: ["ACM", "BDM"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["2", "3", "4"],
  prevStep: step4,
  additions: (props: StepFocusProps) =>
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["ACM", "BDM"],
      props.mode
    ), // TODO make this insert congruent tri vis
  text: EqualTriangles.text(step4SASProps.triangles),
  staticText: () => EqualTriangles.staticText(["ACM", "BDM"]),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, step4SASProps);
  },
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["5"],
  prevStep: step5,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CAM", "DBM"], 2),
  text: EqualAngles.text(["CAM", "DBM"]),
  staticText: () => EqualAngles.staticText(["CAM", "DBM"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["ACM", "BDM"],
      SVGModes.ReliesOn
    );
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.ConverseAltInteriorAngs,
  dependsOn: ["6"],
  prevStep: step6,
  additions: (props: StepFocusProps) => {
    ParallelLines.additions(props, ["AC", "BD"]);
  },
  text: ParallelLines.text(["AC", "BD"]),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
  highlight: (ctx: Content, frame: string) => {
    EqualAngles.highlight(ctx, frame, ["CAM", "DBM"], SVGModes.ReliesOn, 2);
    ctx.getSegment("AM").mode(frame, SVGModes.ReliesOn);
    ctx.getSegment("BM").mode(frame, SVGModes.ReliesOn);
  },
});

export const T1_S1_C1: LayoutProps = {
  name: "T1_S1_C1",
  questions: exploratoryQuestion(4, 7),
  shuffleQuestions: S1C1questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7],
  title: "Prove Segments Parallel #1",
};
