import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { angleStr, comma, segmentStr, strs } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../core/types";
import { ASA, ASAProps } from "../templates/ASA";
import { EqualAngles } from "../templates/EqualAngles";
import { EqualRightAngles } from "../templates/EqualRightAngles";
import { EqualSegments } from "../templates/EqualSegments";
import { Midpoint } from "../templates/Midpoint";
import { Reflexive } from "../templates/Reflexive";
import { RightAngle } from "../templates/RightAngle";
import {
  LayoutProps,
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
  linked,
  makeStepMeta,
} from "../utils";
import { EqualTriangles } from "../templates/EqualTriangles";
import { Perpendicular } from "../templates/Perpendicular";
import { Reasons } from "../reasons";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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
        parentFrame: parentFrame,
      })
    )
  );

  ctx.push(new Triangle({ pts: [A, B, D], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [C, B, D], parentFrame }, ctx));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    const BD = props.ctx.getSegment("BD");
    const ABD = props.ctx.getAngle("ABD");

    return (
      <span>
        {RightAngle.text(props, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD)}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");

    return (
      <span>
        {RightAngle.ticklessText(ctx, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [DBC])}
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
  ticklessText: (ctx: Content) => {
    return Midpoint.ticklessText(ctx, "AC", ["AD", "CD"], "D");
  },
  staticText: () => Midpoint.staticText("D", "AC"),
});

const step1: StepMeta = makeStepMeta({
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
          props.ctx.getTick(ABD, Obj.EqualAngleTick, { frame: props.frame }),
          props.ctx.getTick(DBC, Obj.EqualAngleTick, { frame: props.frame }),
        ])}
      </span>
    );
  },
  staticText: () => givens.staticText(),
});

const step2: StepMeta = makeStepMeta({
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
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step5ASAProps);
  },
  text: (props: StepTextProps) => ASA.text(props, step5ASAProps),
  staticText: () => EqualTriangles.staticText(["ABD", "CBD"]),
});

const step6: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: (props: StepTextProps) => EqualSegments.text(props, ["AD", "DC"], 2),
  staticText: () => EqualSegments.staticText(["AD", "DC"]),
});

const step7: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => step6.additions(props),
  text: (props: StepTextProps) =>
    Midpoint.text(props, "AC", ["AD", "DC"], "D", 2),
  staticText: () => Midpoint.staticText("D", "AC"),
});

export const miniContent = () => {
  let ctx = baseContent(false);

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
  ctx
    .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
    .mode(step7, SVGModes.Purple);
  ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step7, SVGModes.Blue);

  return ctx;
};

// TODO remove
// export const reliesOnText = () => {
//   let relies = new Map<string, string[]>();
//   const s1 = `(1) ${strs.angle}ABD ${strs.congruent} ${strs.angle}CBD`;
//   const s2 = `(2) ${strs.angle}ADB ${strs.congruent} ${strs.angle}BDC`;
//   const s3 = `(3) BD ${strs.congruent} BD`;
//   const s4 = `(4) ${strs.triangle}ABD ${strs.congruent} ${strs.triangle}CBD`;
//   const s5 = `(5) AD ${strs.congruent} DC`;
//   relies.set("s4", [s1, s2, s3]);
//   relies.set("s5", [s4]);
//   relies.set("s6", [s5]);
//   relies.set("s7", [s5]);
//   return relies;
// };

export const P2: LayoutProps = {
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [
    { meta: step1, reason: Reasons.Given },
    { meta: step2, reason: Reasons.PerpendicularLines, dependsOn: [1] },
    { meta: step3, reason: Reasons.CongAdjAngles, dependsOn: [2] },
    { meta: step4, reason: Reasons.Reflexive },
    {
      meta: step5,
      reason: Reasons.ASA,
      dependsOn: [1, 3, 4],
    },
    { meta: step6, reason: Reasons.CorrespondingSegments, dependsOn: [5] },
    { meta: step7, reason: Reasons.Midpoint, dependsOn: [6] },
  ],
};
