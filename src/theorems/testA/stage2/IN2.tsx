import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { segmentStr } from "../../../core/geometryText";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegmentStep } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { ParallelLines } from "../../../core/reasons/ParallelLines";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { exploratoryQuestion } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { BGColors, chipText, makeStepMeta } from "../../utils";

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
    return (
      <span>
        {Midpoint.text("WZ", "M")(isActive)}
        {" and "}
        {chipText(Obj.Segment, "XY", BGColors.Purple, isActive)}
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
  text: ParallelLines.text(["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: Midpoint.text("WZ", "M"),
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
  text: Midpoint.text("XY", "M"),
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
  text: EqualAngles.text(["YMZ", "WMX"]),
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
  text: EqualTriangles.text(step6SASProps.triangles),
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
  text: EqualAngles.text(["MYZ", "MWX"]),
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
  text: ParallelLines.text(["WX", "YZ"]),
  staticText: () => ParallelLines.staticText(["WX", "YZ"]),
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
