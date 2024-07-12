import { Content } from "../../../core/diagramContent";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { segmentStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/templates/CongruentTriangles";
import { EqualAngles } from "../../../core/templates/EqualAngles";
import { EqualSegmentStep } from "../../../core/templates/EqualSegments";
import { EqualTriangles } from "../../../core/templates/EqualTriangles";
import { Midpoint } from "../../../core/templates/Midpoint";
import { ParallelLines } from "../../../core/templates/ParallelLines";
import { SAS, SASProps } from "../../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { exploratoryQuestion } from "../../../questions/funcTypeQuestions";
import { Reasons } from "../../reasons";
import { linked, makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [0, 4], // W
      [4, 4], // X
      [0, 0], // Y
      [4, 0], // Z
      [2, 2], // M
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
      })
    )
  );

  [
    new Triangle({ pts: [M, Y, Z], hoverable, label: "MYZ" }, ctx),
    new Triangle({ pts: [M, W, X], hoverable, label: "MWX" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.push(new Segment({ p1: W, p2: Z, hoverable: false }));
  ctx.push(new Segment({ p1: Y, p2: X, hoverable: false }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (ctx: Content) => {
    const XM = ctx.getSegment("XM");
    const YM = ctx.getSegment("YM");

    return (
      <span>
        {Midpoint.text(ctx, "WZ", ["WM", "MZ"], "M")}
        {" and "}
        {linked("XY", XM, [YM])}
      </span>
    );
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
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ParallelLines.additions(props, ["WX", "YZ"]);
  },
  text: (ctx: Content) => ParallelLines.text(ctx, ["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (ctx: Content) => Midpoint.text(ctx, "WZ", ["WM", "MZ"], "M"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", ["WM", "MZ"]);
  },
  staticText: () => Midpoint.staticText("M", "WZ"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (ctx: Content) => Midpoint.text(ctx, "XY", ["XM", "YM"], "M"),
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "M", ["YM", "XM"], 2);
  },
  staticText: () => Midpoint.staticText("M", "XY"),
});

const step3: StepMeta = EqualSegmentStep(
  ["WM", "MZ"],
  Reasons.Midpoint,
  step2,
  1,
  [1]
);
const step4: StepMeta = EqualSegmentStep(
  ["XM", "YM"],
  Reasons.Midpoint,
  step3,
  2,
  [2]
);

const step5: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: [1, 2],
  unfocused: (props: StepUnfocusProps) => {
    step4.unfocused(props);
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["YMZ", "WMX"]),
  text: (ctx: Content) => EqualAngles.text(ctx, ["YMZ", "WMX"]),
  staticText: () => EqualAngles.staticText(["YMZ", "WMX"]),
});

const step6SASProps: SASProps = {
  seg1s: { s: ["WM", "MZ"], ticks: 1 },
  seg2s: { s: ["XM", "YM"], ticks: 2 },
  angles: { a: ["YMZ", "WMX"] },
  triangles: ["MYZ", "MWX"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [3, 4, 5],
  additions: (props: StepFocusProps) => SAS.additions(props, step6SASProps),
  text: (ctx: Content) => EqualTriangles.text(ctx, step6SASProps.triangles),
  staticText: () => EqualTriangles.staticText(step6SASProps.triangles),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["MYZ", "MWX"], 2),
  text: (ctx: Content) => EqualAngles.text(ctx, ["MYZ", "MWX"]),
  staticText: () => EqualAngles.staticText(["MYZ", "MWX"]),
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseAltInteriorAngs,
  dependsOn: [7],
  unfocused: (props: StepUnfocusProps) => {
    step7.additions({ ...props, mode: SVGModes.Unfocused });
    step7.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    ParallelLines.additions(props, ["WX", "YZ"]),
  text: (ctx: Content) => ParallelLines.text(ctx, ["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
});

const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };

  const step3 = ctx.addFrame("s3");
  Midpoint.additions(
    { ...defaultStepProps, frame: step3 },
    "M",
    ["WM", "MZ"],
    1,
    SVGModes.Blue
  );
  const step4 = ctx.addFrame("s4");
  Midpoint.additions(
    { ...defaultStepProps, frame: step4 },
    "M",
    ["YM", "XM"],
    2,
    SVGModes.Blue
  );

  const step5 = ctx.addFrame("s5");
  ctx.getTriangle("MYZ").mode(step5, SVGModes.Focused);
  ctx.getTriangle("MWX").mode(step5, SVGModes.Focused);
  ctx.getSegment("WX").mode(step5, SVGModes.Hidden);
  ctx.getSegment("YZ").mode(step5, SVGModes.Hidden);
  EqualAngles.additions(
    { ...defaultStepProps, frame: step5 },
    ["WMX", "YMZ"],
    1,
    SVGModes.Blue
  );

  const step6 = ctx.addFrame("s6");
  SAS.additions(
    { ...defaultStepProps, frame: step6 },
    {
      seg1s: { s: ["WM", "MZ"], ticks: 1 },
      seg2s: { s: ["XM", "YM"], ticks: 2 },
      angles: { a: ["WMX", "YMZ"] },
      triangles: ["MWX", "MYZ"],
    },
    SVGModes.Blue
  );

  const step7 = ctx.addFrame("s7");
  CongruentTriangles.additions(
    { ...defaultStepProps, frame: step7, mode: SVGModes.Focused },
    {
      s1s: ["WM", "MZ"],
      s2s: ["XM", "YM"],
      s3s: ["WX", "YZ"],
      a1s: ["WMX", "YMZ"],
      a2s: ["MXW", "MYZ"],
      a3s: ["MWX", "MZY"],
    }
  );
  EqualAngles.additions(
    { ...defaultStepProps, frame: step7 },
    ["MXW", "MYZ"],
    2,
    SVGModes.Blue
  );

  const step8 = ctx.addFrame("s8");
  ctx.getSegment("YM").mode(step8, SVGModes.Focused);
  ctx.getSegment("XM").mode(step8, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultStepProps, mode: SVGModes.Focused, frame: step8 },
    ["MYZ", "MXW"]
  );
  ParallelLines.additions(
    { ...defaultStepProps, frame: step8 },
    ["WX", "YZ"],
    1,
    SVGModes.Blue
  );

  return ctx;
};

export const T1_S2_IN2: LayoutProps = {
  name: "T1_S2_IN2",
  questions: exploratoryQuestion(3, 8),
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
};
