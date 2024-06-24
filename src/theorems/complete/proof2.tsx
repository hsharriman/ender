import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { angleStr, comma, segmentStr } from "../../core/geometryText";
import { ASA, ASAProps } from "../../core/templates/ASA";
import { BaseAngle } from "../../core/templates/BaseAngle";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Midpoint } from "../../core/templates/Midpoint";
import { Perpendicular } from "../../core/templates/Perpendicular";
import { Reflexive } from "../../core/templates/Reflexive";
import { RightAngle } from "../../core/templates/RightAngle";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { completeProof2 } from "../../questions/completeQuestions";
import { Reasons } from "../reasons";
import { linked, makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [1, 0],
      [3, 4],
      [5, 0],
      [3, 0],
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

  ctx.push(new Triangle({ pts: [A, B, D], hoverable }, ctx));
  ctx.push(new Triangle({ pts: [C, B, D], hoverable }, ctx));

  // for given step:
  ctx.push(new Angle({ start: A, center: B, end: C, hoverable }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    const BD = props.ctx.getSegment("BD");

    return (
      <span>
        {RightAngle.text(props, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {BaseAngle.text(props, "ABC")}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const BD = ctx.getSegment("BD");

    return (
      <span>
        {RightAngle.ticklessText(ctx, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {BaseAngle.ticklessText(ctx, "ABC")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
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
  text: (props: StepTextProps) => {
    return Midpoint.text(props, "AC", ["AD", "CD"], "D");
  },
  staticText: () => Midpoint.staticText("D", "AC"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CBD"]);
    RightAngle.additions(props, "ADB");
  },
  text: (props: StepTextProps) => {
    const BD = props.ctx.getSegment("BD");
    const ABD = props.ctx.getAngle("ABD");
    const DBC = props.ctx.getAngle("CBD");

    return (
      <span>
        {RightAngle.text(props, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [
          DBC,
          props.ctx.getSegment("AB"),
          props.ctx.getSegment("BC"),
        ])}
      </span>
    );
  },
  staticText: () => givens.staticText(),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(stepProps);
    step1.additions(stepProps);
  },
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "DC"]),
  text: (props: StepTextProps) =>
    Perpendicular.text(props, "AC", ["AD", "DC"], "BD"),
  staticText: () => Perpendicular.staticText("BD", "AC"),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [2],
  unfocused: (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(stepProps);
    step1.additions(stepProps);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: (props: StepTextProps) => EqualRightAngles.text(props, ["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(stepProps);
    step1.additions(stepProps);
    step2.additions(stepProps);
  },
  additions: (props: StepFocusProps) => Reflexive.additions(props, "BD"),
  text: (props: StepTextProps) => Reflexive.text(props, "BD"),
  staticText: () => Reflexive.staticText("BD"),
});

const step5ASAProps: ASAProps = {
  a1s: { angles: ["ADB", "BDC"], tick: Obj.RightTick },
  a2s: { angles: ["ABD", "CBD"], tick: Obj.EqualAngleTick },
  segs: ["BD", "BD"],
  triangles: ["ABD", "CBD"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [1, 3, 4],
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step5ASAProps);
  },
  text: (props: StepTextProps) => ASA.text(props, step5ASAProps),
  staticText: () => EqualTriangles.staticText(["ABD", "CBD"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingSegments,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: (props: StepTextProps) => EqualSegments.text(props, ["AD", "DC"], 2),
  staticText: () => EqualSegments.staticText(["AD", "DC"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => step6.additions(props),
  text: (props: StepTextProps) =>
    Midpoint.text(props, "AC", ["AD", "DC"], "D", 2),
  staticText: () => Midpoint.staticText("D", "AC"),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };

  // STEP 2 - PERPENDICULAR LINES
  const step2 = ctx.addFrame("s2");
  const BD = ctx.getSegment("BD").mode(step2, SVGModes.Focused);
  const AD = ctx.getSegment("AD").mode(step2, SVGModes.Focused);
  const CD = ctx.getSegment("CD").mode(step2, SVGModes.Focused);
  RightAngle.additions({ ...defaultStepProps, frame: step2 }, "ADB");

  const step3 = ctx.addFrame("s3");
  BD.mode(step3, SVGModes.Focused);
  AD.mode(step3, SVGModes.Focused);
  CD.mode(step3, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["ADB", "BDC"],
    SVGModes.Blue
  );

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s4");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "BD");

  // STEP 4 - ASA CONGRUENCE
  const step5 = ctx.addFrame("s5");
  ASA.additions(
    { ...defaultStepProps, frame: step5 },
    {
      a1s: { angles: ["ADB", "BDC"], tick: Obj.RightTick },
      a2s: { angles: ["ABD", "CBD"], tick: Obj.EqualAngleTick },
      segs: ["BD", "BD"],
      triangles: ["ABD", "CBD"],
    },
    SVGModes.Blue
  );
  const ABD = ctx.getTriangle("ABD");
  // BD.mode(step4, SVGModes.Purple);
  // // ADB.mode(step4, SVGModes.Purple);
  const aABD = ctx.getAngle("ABD");
  // ctx.pushTick(ADB, Obj.RightTick).mode(step4, SVGModes.Purple);
  // ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step4, SVGModes.Purple);

  const CBD = ctx.getTriangle("CBD");
  const DBC = ctx.getAngle("CBD");
  // ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step4, SVGModes.Blue);
  const aBDC = ctx.getAngle("BDC");
  // ctx.pushTick(aBDC, Obj.RightTick).mode(step4, SVGModes.Blue);
  // ctx.pushTick(BD, Obj.EqualLengthTick).mode(step4, SVGModes.Blue);

  // STEP 5 - CORRESPONDING SEGMENTS
  const step6 = ctx.addFrame("s6");
  // ABD.mode(step6, SVGModes.Focused);
  // CBD.mode(step6, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ABD", "CBD"]
  );
  // BD.mode(step6, SVGModes.Focused);
  // ctx.pushTick(BD, Obj.EqualLengthTick).mode(step6, SVGModes.Focused);
  Reflexive.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    "BD"
  );
  // ctx
  //   .pushTick(ctx.getAngle("ADB"), Obj.RightTick)
  //   .mode(step6, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ADB", "BDC"]
  );
  // ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step6, SVGModes.Focused);
  // ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step6, SVGModes.Focused);
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
  // ctx.pushTick(aBDC, Obj.RightTick).mode(step6, SVGModes.Focused);
  // AD.mode(step6, SVGModes.Purple);
  // CD.mode(step6, SVGModes.Blue);
  // ctx
  //   .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
  //   .mode(step6, SVGModes.Purple);
  // ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step6, SVGModes.Blue);
  // const AB = ctx.getSegment("AB").mode(step6, SVGModes.Focused);
  // const CB = ctx.getSegment("CB").mode(step6, SVGModes.Focused);
  // ctx
  //   .pushTick(AB, Obj.EqualLengthTick, { num: 3 })
  //   .mode(step5, SVGModes.Focused);
  // ctx
  //   .pushTick(CB, Obj.EqualLengthTick, { num: 3 })
  //   .mode(step5, SVGModes.Focused);

  // STEP 6 - MIDPOINT
  const step7 = ctx.addFrame("s7");
  AD.mode(step7, SVGModes.Purple);
  CD.mode(step7, SVGModes.Blue);
  AD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Purple);
  CD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Blue);

  return ctx;
};

export const P2: LayoutProps = {
  questions: completeProof2,
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7],
};
