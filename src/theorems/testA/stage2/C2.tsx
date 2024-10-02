import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { EqualAngles, EqualAngleStep } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegments,
  EqualSegmentStep,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive, ReflexiveStep } from "../../../core/reasons/Reflexive";
import { SAS } from "../../../core/reasons/SAS";
import { exploratoryQuestion } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
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
    new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx),
    new Triangle({ pts: [B, C, D], hoverable, label: "BCD" }, ctx),
    new Triangle({ pts: [B, C, G], hoverable, label: "BCG" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (ctx: Content) => {
    return (
      <span>
        {Perpendicular.text(ctx, "AC", ["AD", "CD"], "BD")}
        {comma}
        {EqualSegments.text(ctx, ["AD", "DC"])}
        {comma}
        {EqualAngles.text(ctx, ["FAB", "GCB"])}
        {comma}
        {EqualSegments.text(ctx, ["AF", "CG"])}
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
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["AFB", "CGB"]),
  text: (ctx: Content) => EqualAngles.text(ctx, ["AFB", "CGB"]),
  staticText: () => EqualAngles.staticText(["AFB", "CGB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (ctx: Content) => Perpendicular.text(ctx, "AC", ["AD", "CD"], "BD"),
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "CD"]),
  staticText: () => Perpendicular.staticText("AC", "BD"),
});

const step2: StepMeta = EqualSegmentStep(["AD", "DC"], Reasons.Given, step1);
const step3: StepMeta = EqualAngleStep(["FAB", "GCB"], Reasons.Given, step2);
const step4: StepMeta = EqualSegmentStep(["AF", "CG"], Reasons.Given, step3, 2);
const step5: StepMeta = ReflexiveStep("BD", 3, step4);

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: (ctx: Content) => EqualRightAngles.text(ctx, ["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 5, 6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step2.additions(props);
    step5.additions(props);
    step6.additions(props);

    props.ctx.getSegment("AB").mode(props.frame, props.mode);
    props.ctx.getSegment("CB").mode(props.frame, props.mode);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABD", "BCD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "BCD"]),
});

const step8: StepMeta = EqualSegmentStep(
  ["AB", "BC"],
  Reasons.CPCTC,
  step7,
  4,
  [7]
);
const step9: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [3, 4, 8],
  unfocused: (props: StepUnfocusProps) => {
    step8.additions({ ...props, mode: SVGModes.Unfocused });
    step8.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step3.additions(props);
    step4.additions(props);
    step8.additions(props);
    props.ctx.getSegment("FB").mode(props.frame, props.mode);
    props.ctx.getSegment("GB").mode(props.frame, props.mode);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABF", "BCG"]),
  staticText: () => EqualTriangles.staticText(["ABF", "BCG"]),
});

const step10: StepMeta = EqualAngleStep(
  ["AFB", "CGB"],
  Reasons.CPCTC,
  step9,
  2,
  [9]
);

const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };

  const reflex = ctx.addFrame("s5");
  Reflexive.additions({ ...defaultStepProps, frame: reflex }, "BD", 3);

  const perpLines = ctx.addFrame("s6");
  Perpendicular.additions(
    { ...defaultStepProps, frame: perpLines, mode: SVGModes.Focused },
    "BD",
    ["AD", "CD"]
  );
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: perpLines },
    ["ADB", "BDC"],
    SVGModes.Blue
  );

  const s7SAS = ctx.addFrame("s7");
  SAS.additions(
    { ...defaultStepProps, frame: s7SAS },
    {
      seg1s: { s: ["AD", "DC"], ticks: 1 },
      seg2s: { s: ["BD", "BD"], ticks: 3 },
      angles: { a: ["ADB", "BDC"], type: Obj.RightTick },
      triangles: ["ADB", "BCD"],
    },
    SVGModes.Blue
  );
  ctx.getSegment("AB").mode(s7SAS, SVGModes.Purple); // TODO why doesn't this show as part of triangle?

  const s8corresponding = ctx.addFrame("s8");
  const s8Props = { ctx, frame: s8corresponding, mode: SVGModes.Focused };
  EqualSegments.additions(s8Props, ["AD", "DC"], 1);
  EqualSegments.additions(s8Props, ["BD", "BD"], 3);
  EqualSegments.additions(
    { ...defaultStepProps, frame: s8corresponding },
    ["AB", "CB"],
    4,
    SVGModes.Blue
  );
  EqualRightAngles.additions(s8Props, ["ADB", "CDB"]);
  EqualAngles.additions(s8Props, ["BAD", "BCD"], 2);
  EqualAngles.additions(s8Props, ["ABD", "CBD"], 1);

  const s9SAS = ctx.addFrame("s9");
  SAS.additions(
    { ...defaultStepProps, frame: s9SAS },
    {
      seg1s: { s: ["AB", "CB"], ticks: 4 },
      seg2s: { s: ["FA", "GC"], ticks: 2 },
      angles: { a: ["FAB", "GCB"], type: Obj.EqualAngleTick },
      triangles: ["FAB", "GCB"],
    },
    SVGModes.Blue
  );

  const s10 = ctx.addFrame("s10");
  const s10Props = { ctx, frame: s10, mode: SVGModes.Focused };
  EqualSegments.additions(s10Props, ["AB", "CB"], 4);
  EqualSegments.additions(s10Props, ["FA", "GC"], 2);
  EqualSegments.additions(s10Props, ["FB", "GB"], 1);
  EqualAngles.additions(s10Props, ["FAB", "GCB"], 1);
  EqualAngles.additions(s10Props, ["FBA", "GBC"], 3);
  EqualAngles.additions(
    { ...defaultStepProps, frame: s10 },
    ["AFB", "CGB"],
    2,
    SVGModes.Blue
  );

  return ctx;
};

export const T1_S2_C2: LayoutProps = {
  name: "T1_S2_C2",
  questions: exploratoryQuestion(5, 10),
  miniContent: miniContent(),
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
