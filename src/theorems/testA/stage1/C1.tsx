import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
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
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = () => {
  let ctx = new Content();
  const [A, B, C, D, M] = ctx.addPoints([
    { pt: [5, 9], label: "A", offset: [5, 5] },
    { pt: [10, 2], label: "B", offset: [10, -10] },
    { pt: [1, 3], label: "C", offset: [-20, -20] },
    { pt: [14, 8], label: "D", offset: [3, 3] },
    { pt: [7.5, 5.5], label: "M", offset: [0, 10] },
  ]);

  ctx.addTriangles([
    { pts: [A, C, M] },
    { pts: [B, D, M], rotatePattern: true },
  ]);

  ctx.addSegments([
    { p1: A, p2: B },
    { p1: C, p2: D },
  ]);

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {segmentStr("AB", true)}
        {" and "}
        {segmentStr("CD", true)}
        {" intersect at point M"}
        {comma}
        {EqualSegments.text(["AM", "BM"])(true)}
        {comma}
        {EqualSegments.text(["CM", "DM"])(true)}
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
  text: (isActive: boolean) => ParallelLines.text(["AC", "BD"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: (isActive: boolean) => {
    return (
      <span>
        {segmentStr("AB", isActive)}
        {" and "}
        {segmentStr("CD", isActive)}
        {" intersect at point M"}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("AM").mode(props.frame, props.mode);
    props.ctx.getSegment("BM").mode(props.frame, props.mode);
    props.ctx.getSegment("CM").mode(props.frame, props.mode);
    props.ctx.getSegment("DM").mode(props.frame, props.mode);
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AM", "BM"]),
  text: EqualSegments.text(["AM", "BM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step2,
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["CM", "DM"], 2),
  text: EqualSegments.text(["CM", "DM"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CMA", "DMB"]),
  text: EqualAngles.text(["CMA", "DMB"]),
  highlight: (props: StepProps) =>
    VerticalAngles.highlight(
      props,
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
    CongruentTriangles.congruentLabel(props, ["ACM", "BDM"], props.mode),
  text: EqualTriangles.text(step4SASProps.triangles),
  highlight: (props: StepProps) => {
    SAS.highlight(props, step4SASProps);
  },
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["5"],
  prevStep: step5,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CAM", "DBM"], 2),
  text: EqualAngles.text(["CAM", "DBM"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["ACM", "BDM"], SVGModes.ReliesOn);
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
  highlight: (props: StepProps) => {
    EqualAngles.highlight(props, ["CAM", "DBM"], SVGModes.ReliesOn, 2);
    props.ctx.getSegment("AB").mode(props.frame, SVGModes.ReliesOn);
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
