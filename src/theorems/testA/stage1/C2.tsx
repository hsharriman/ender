import { Content } from "../../../core/diagramContent";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, segmentStr } from "../../../core/geometryText";
import { AspectRatio } from "../../../core/svg/svgTypes";
import { ASA, ASAProps } from "../../../core/templates/ASA";
import { BaseAngle } from "../../../core/templates/BaseAngle";
import { EqualAngles } from "../../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../../core/templates/EqualSegments";
import { EqualTriangles } from "../../../core/templates/EqualTriangles";
import { Midpoint } from "../../../core/templates/Midpoint";
import { Perpendicular } from "../../../core/templates/Perpendicular";
import { Reflexive } from "../../../core/templates/Reflexive";
import { RightAngle } from "../../../core/templates/RightAngle";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { completeProof2 } from "../../../questions/funcTypeQuestions";
import { definitions } from "../../definitions";
import { Reasons } from "../../reasons";
import { linked, makeStepMeta, tooltip } from "../../utils";

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
  text: (ctx: Content) => {
    const BD = ctx.getSegment("BD");

    return (
      <span>
        {RightAngle.text(ctx, "ADB")}
        {comma}
        {linked("BD", BD)}
        {tooltip(<span> bisects </span>, definitions.Bisector)}
        {BaseAngle.text(ctx, "ABC")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
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
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "D", ["AD", "CD"]);
  },
  text: (ctx: Content) => {
    return Midpoint.text(ctx, "AC", ["AD", "CD"], "D");
  },
  staticText: () => Midpoint.staticText("D", "AC"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "ADB");
  },
  text: (ctx: Content) => RightAngle.text(ctx, "ADB"),
  staticText: () => RightAngle.staticText("ADB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.additions({ ...props, mode: SVGModes.Unfocused });
    step1.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CBD"]);
  },
  text: (ctx: Content) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");

    return (
      <span>
        {linked("BD", BD)}
        {tooltip(<span> bisects </span>, definitions.Bisector)}
        {linked("ABC", ABD, [DBC, ctx.getSegment("AB"), ctx.getSegment("BC")])}
      </span>
    );
  },
  staticText: () => (
    <span>
      {segmentStr("BD")} bisects {angleStr("ABC")}
    </span>
  ),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "DC"]),
  text: (ctx: Content) => Perpendicular.text(ctx, "AC", ["AD", "DC"], "BD"),
  staticText: () => Perpendicular.staticText("BD", "AC"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [3],
  unfocused: (props: StepUnfocusProps) => {
    step3.additions({ ...props, mode: SVGModes.Unfocused });
    step3.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: (ctx: Content) => EqualRightAngles.text(ctx, ["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
    step4.unfocused(props);
  },
  additions: (props: StepFocusProps) => Reflexive.additions(props, "BD"),
  text: (ctx: Content) => Reflexive.text(ctx, "BD"),
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
  dependsOn: [2, 4, 5],
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step5ASAProps);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["ABD", "CBD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "CBD"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: (ctx: Content) => EqualSegments.text(ctx, ["AD", "DC"]),
  staticText: () => EqualSegments.staticText(["AD", "DC"]),
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: [7],
  unfocused: (props: StepUnfocusProps) => {
    step7.unfocused(props);
  },
  additions: (props: StepFocusProps) => step7.additions(props),
  text: (ctx: Content) => Midpoint.text(ctx, "AC", ["AD", "DC"], "D"),
  staticText: () => Midpoint.staticText("D", "AC"),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };

  // STEP 2 - PERPENDICULAR LINES
  const step2 = ctx.addFrame("s3");
  const BD = ctx.getSegment("BD").mode(step2, SVGModes.Focused);
  const AD = ctx.getSegment("AD").mode(step2, SVGModes.Focused);
  const CD = ctx.getSegment("CD").mode(step2, SVGModes.Focused);
  RightAngle.additions({ ...defaultStepProps, frame: step2 }, "ADB");

  const step3 = ctx.addFrame("s4");
  BD.mode(step3, SVGModes.Focused);
  AD.mode(step3, SVGModes.Focused);
  CD.mode(step3, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["ADB", "BDC"],
    SVGModes.Blue
  );

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s5");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "BD");

  // STEP 4 - ASA CONGRUENCE
  const step5 = ctx.addFrame("s6");
  ASA.additions(
    { ...defaultStepProps, frame: step5 },
    {
      a1s: { a: ["ADB", "BDC"], type: Obj.RightTick },
      a2s: { a: ["ABD", "CBD"], type: Obj.EqualAngleTick },
      segs: { s: ["BD", "BD"] },
      triangles: ["ABD", "CBD"],
    },
    SVGModes.Blue
  );

  // STEP 5 - CORRESPONDING SEGMENTS
  const step6 = ctx.addFrame("s7");
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ABD", "CBD"]
  );
  Reflexive.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    "BD"
  );
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ADB", "BDC"]
  );
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ABD", "CBD"]
  );
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["BAD", "BCD"],
    2
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6 },
    ["AD", "DC"],
    2,
    SVGModes.Blue
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["AB", "CB"],
    3
  );

  // STEP 6 - MIDPOINT
  const step7 = ctx.addFrame("s8");
  AD.mode(step7, SVGModes.Purple);
  CD.mode(step7, SVGModes.Blue);
  AD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Purple);
  CD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Blue);

  return ctx;
};

export const T1_S1_C2: LayoutProps = {
  name: "T1_S1_C2",
  questions: completeProof2,
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Prove D is the midpoint of AC",
};
