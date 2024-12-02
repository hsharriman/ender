import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { segmentStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegmentStep } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { ParallelLines } from "../../../core/reasons/ParallelLines";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { VerticalAngles } from "../../../core/reasons/VerticalAngles";
import { exploratoryQuestion } from "../../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 9], // W
      [9, 9], // X
      [2, 1], // Y
      [9, 1], // Z
      [5.5, 5], // M
    ],
  ];
  let ctx = new Content();
  const labels = ["W", "X", "Y", "Z", "M"];
  const offsets: Vector[] = [
    [-15, 0],
    [5, -3],
    [-17, -17],
    [3, -10],
    [10, -5],
  ];
  const pts = coords[0];
  const [W, X, Y, Z, M] = pts.map((c, i) =>
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

  [
    new Triangle({ pts: [M, Y, Z], hoverable, label: "MYZ" }, ctx),
    new Triangle({ pts: [M, W, X], hoverable, label: "MWX" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.push(new Segment({ p1: W, p2: Z, hoverable: false }));
  ctx.push(new Segment({ p1: Y, p2: X, hoverable: false }));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return givens.staticText();
  },
  staticText: () => {
    return (
      <span>
        {Midpoint.staticText("M", "WZ")}
        {" and "}
        {segmentStr("XY")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("MYZ").mode(props.frame, props.mode);
    props.ctx.getTriangle("MWX").mode(props.frame, props.mode);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    ParallelLines.additions({ ...props, mode: SVGModes.Derived }, ["WX", "YZ"]);
  },
  text: ParallelLines.text(["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: Midpoint.text("M", "WZ"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", ["WM", "MZ"]);
  },
  staticText: () => Midpoint.staticText("M", "WZ"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  text: Midpoint.text("M", "XY"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", ["YM", "XM"], 2);
  },
  staticText: () => Midpoint.staticText("M", "XY"),
});

const step3: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["WM", "MZ"], Reasons.Midpoint, step2, 1, ["1"]),
  highlight: (ctx: Content, frame: string) =>
    ctx.getPoint("M").mode(frame, SVGModes.ReliesOnPoint),
});

const step4: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["XM", "YM"], Reasons.Midpoint, step3, 2, ["2"]),
  highlight: (ctx: Content, frame: string) =>
    ctx.getPoint("M").mode(frame, SVGModes.ReliesOnPoint),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: ["1", "2"],
  prevStep: step4,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["YMZ", "WMX"]),
  text: EqualAngles.text(["YMZ", "WMX"]),
  staticText: () => EqualAngles.staticText(["YMZ", "WMX"]),
  highlight: (ctx: Content, frame: string) =>
    VerticalAngles.highlight(
      ctx,
      frame,
      { angs: ["YMZ", "WMX"], segs: ["WM", "MZ"] },
      ["XM", "YM"]
    ),
});

const step6SASProps: SASProps = {
  seg1s: { s: ["WM", "MZ"], ticks: 1 },
  seg2s: { s: ["XM", "YM"], ticks: 2 },
  angles: { a: ["YMZ", "WMX"] },
  triangles: ["MYZ", "MWX"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["3", "4", "5"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["MYZ", "MWX"],
      props.mode
    );
  },
  text: EqualTriangles.text(step6SASProps.triangles),
  staticText: () => EqualTriangles.staticText(step6SASProps.triangles),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, step6SASProps);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  prevStep: step6,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["MYZ", "MWX"], 2),
  text: EqualAngles.text(["MYZ", "MWX"]),
  staticText: () => EqualAngles.staticText(["MYZ", "MWX"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["MYZ", "MWX"],
      SVGModes.ReliesOn
    );
    EqualAngles.highlight(ctx, frame, ["MYZ", "MWX"], SVGModes.Inconsistent, 2);
  },
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseAltInteriorAngs,
  dependsOn: ["7?"],
  prevStep: step7,
  additions: (props: StepFocusProps) =>
    ParallelLines.additions(props, ["WX", "YZ"]),
  text: ParallelLines.text(["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
  highlight: (ctx: Content, frame: string) => {
    ctx.getSegment("YX").mode(frame, SVGModes.ReliesOn);
    ctx
      .getAngle("MYZ")
      .addTick(frame, Obj.EqualAngleTick, 2)
      .mode(frame, SVGModes.ReliesOn);
    ctx
      .getAngle("MXW")
      .addTick(frame, Obj.EqualAngleTick, 2)
      .mode(frame, SVGModes.Inconsistent);
  },
});

export const T1_S2_IN2: LayoutProps = {
  name: "T1_S2_IN2",
  questions: exploratoryQuestion(3, 8),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Prove Segments Parallel #2 [M]",
};
