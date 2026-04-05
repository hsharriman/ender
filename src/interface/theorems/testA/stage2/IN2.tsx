import { Obj } from "geometry-object";
import { DiagramContent } from "../../../core/builder/DiagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { segmentStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegmentStep } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { ParallelLines } from "../../../core/reasons/ParallelLines";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { VerticalAngles } from "../../../core/reasons/VerticalAngles";
import { ShowPoint, SVGModes } from "../../../core/types/diagramTypes";
import { LayoutProps } from "../../../core/types/layoutTypes";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = () => {
  let ctx = new DiagramContent();
  const W = ctx.addPoint({ pt: [2, 9], label: "W" }, [-15, 0]);
  const X = ctx.addPoint({ pt: [9, 9], label: "X" }, [5, -3]);
  const Y = ctx.addPoint({ pt: [2, 1], label: "Y" }, [-17, -17]);
  const Z = ctx.addPoint({ pt: [9, 1], label: "Z" }, [3, -10]);
  const M = ctx.addPoint(
    { pt: [5.5, 5], label: "M" },
    [10, -5],
    ShowPoint.Adaptive,
  );

  ctx.addTriangle({ pts: [M.obj, Y.obj, Z.obj] });
  ctx.addTriangle({ pts: [M.obj, W.obj, X.obj] }, true);

  ctx.addSegment({ p1: W.obj, p2: Z.obj });
  ctx.addSegment({ p1: Y.obj, p2: X.obj });

  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Midpoint.text("M", "WZ")(true)}
        {" and "}
        {segmentStr("XY", true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("MYZ").mode(props.frame, props.mode);
    props.ctx.getTriangle("MWX").mode(props.frame, props.mode);
    Midpoint.additions(props, "M", "WZ");
    Midpoint.additions(props, "M", "YM");
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    ParallelLines.additions({ ...props, mode: SVGModes.Derived }, ["WX", "YZ"]);
  },
  text: (active: boolean) => ParallelLines.text(["WX", "YZ"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  text: Midpoint.text("M", "WZ"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", "WZ");
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  text: Midpoint.text("M", "XY"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", "YM");
  },
});

const step3: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["WM", "MZ"], Reasons.Midpoint, step2, 1, ["1"]),
  highlight: (props: StepProps) =>
    props.ctx.getPoint("M").mode(props.frame, SVGModes.ReliesOn),
});

const step4: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["XM", "YM"], Reasons.Midpoint, step3, 2, ["2"]),
  highlight: (props: StepProps) =>
    props.ctx.getPoint("M").mode(props.frame, SVGModes.ReliesOn),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: ["1", "2"],
  prevStep: step4,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["YMZ", "WMX"]),
  text: EqualAngles.text(["YMZ", "WMX"]),
  highlight: (props: StepProps) =>
    VerticalAngles.highlight(props, "WZ", "XY", "M"),
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
    CongruentTriangles.congruentLabel(props, ["MYZ", "MWX"], props.mode);
  },
  text: EqualTriangles.text(step6SASProps.triangles),
  highlight: (props: StepProps) => {
    SAS.highlight(props, step6SASProps);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  prevStep: step6,
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["MYZ", "MWX"], 2),
  text: EqualAngles.text(["MYZ", "MWX"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["MYZ", "MWX"], SVGModes.ReliesOn);
    EqualAngles.highlight(props, ["MYZ", "MWX"], SVGModes.Inconsistent, 2);
  },
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseAltInteriorAngs,
  dependsOn: ["7?"],
  prevStep: step7,
  additions: (props: StepFocusProps) =>
    ParallelLines.additions(props, ["WX", "YZ"]),
  text: ParallelLines.text(["WX", "YZ"]),
  highlight: (props: StepProps) => {
    const { ctx, frame } = props;
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
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Prove Segments Parallel #2 [M]",
  diagramAspect: AspectRatio.Square,
};
