import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { ASA, ASAProps } from "../../core/templates/ASA";
import { EqualAngleStep, EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { ReflexiveStep } from "../../core/templates/Reflexive";
import { RightAngle, RightAngleStep } from "../../core/templates/RightAngle";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { completeProof3 } from "../../questions/completeQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [0, 0], // L
      [2, 0], //S
      [4, 0], // U
      [2, 1.08], //R
      [0.75, 1.5], //N
      [3.25, 1.5], //Q
      [2, 4], //P
    ],
  ];
  let ctx = new Content();
  const labels = ["L", "S", "U", "R", "N", "Q", "P"];
  const offsets: Vector[] = [
    [-15, -15],
    [-5, -18],
    [0, -17],
    [8, 5],
    [-16, 0],
    [5, 5],
    [8, -10],
  ];
  const pts = coords[0];
  const [L, S, U, R, N, Q, P] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [L, P, S], hoverable, label: "LPS" }, ctx));
  ctx.push(new Triangle({ pts: [L, N, U], hoverable, label: "LNU" }, ctx));
  ctx.push(new Triangle({ pts: [U, Q, L], hoverable, label: "UQL" }, ctx));
  ctx.push(new Triangle({ pts: [U, P, S], hoverable, label: "UPS" }, ctx));

  // for ASA at the end
  // ctx.push(new Angle({ start: L, center: N, end: U, hoverable }));
  // ctx.push(new Angle({ start: U, center: Q, end: N, hoverable }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (ctx: Content) => {
    return (
      <span>
        {RightAngle.text(ctx, "PSU")}
        {comma}
        {EqualSegments.text(ctx, ["LN", "QU"])}
        {comma}
        {EqualAngles.text(ctx, ["LPS", "UPS"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LPS").mode(props.frame, props.mode);
    props.ctx.getTriangle("LNU").mode(props.frame, props.mode);
    props.ctx.getTriangle("UQL").mode(props.frame, props.mode);
    props.ctx.getTriangle("UPS").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
  staticText: () => {
    return (
      <span>
        {RightAngle.staticText("PSU")}
        {comma}
        {EqualSegments.staticText(["LN", "QU"])}
        {comma}
        {EqualAngles.staticText(["LPS", "UPS"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LNU").mode(props.frame, props.mode);
    props.ctx.getTriangle("UQL").mode(props.frame, props.mode);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, ["LNU", "UQL"]),
  staticText: () => EqualTriangles.staticText(["LNU", "UQL"]),
});

const step1: StepMeta = RightAngleStep(
  "PSU",
  Reasons.Given,
  undefined,
  proves.unfocused
);

const step2: StepMeta = EqualSegmentStep(["LN", "QU"], Reasons.Given, step1);

const step3: StepMeta = EqualAngleStep(["LPS", "UPS"], Reasons.Given, step2);

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["PSL", "PSU"]),
  text: (ctx: Content) => EqualRightAngles.text(ctx, ["PSL", "PSU"]),
  staticText: () => EqualRightAngles.staticText(["PSL", "PSU"]),
});

const step5: StepMeta = ReflexiveStep("PS", 2, step4);

const step6ASAProps: ASAProps = {
  a1s: { a: ["PSU", "PSL"], type: Obj.RightTick },
  a2s: { a: ["LPS", "UPS"], type: Obj.EqualAngleTick },
  segs: { s: ["PS", "PS"] },
  triangles: ["LSP", "USP"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [3, 4, 5],
  unfocused: (props: StepUnfocusProps) => {
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step6ASAProps);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, step6ASAProps.triangles),
  staticText: () => EqualTriangles.staticText(step6ASAProps.triangles),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingAngles,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["SLP", "SUP"], 2);
  },
  text: (ctx: Content) => EqualAngles.text(ctx, ["SLP", "SUP"]),
  staticText: () => EqualAngles.staticText(["SLP", "SUP"]),
});

// INCORRECT VERSION -- Correct would be reflexive LU
const step8: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingAngles,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step7.additions({ ...props, mode: SVGModes.Unfocused });
    step7.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["LNU", "UQL"], 3);
  },
  text: (ctx: Content) => EqualAngles.text(ctx, ["LNU", "UQL"]),
  staticText: () => EqualAngles.staticText(["LNU", "UQL"]),
});

// INCORRECT VERSION -- Correct would be SAS
const step9ASAProps: ASAProps = {
  a1s: { a: ["ULN", "LUQ"], type: Obj.EqualAngleTick, ticks: 2 },
  a2s: { a: ["LNU", "UQL"], type: Obj.EqualAngleTick, ticks: 3 },
  segs: { s: ["LN", "QU"] },
  triangles: ["LNU", "UQL"],
};
const step9: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [2, 7, 8],
  unfocused: (props: StepUnfocusProps) => {
    step8.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step9ASAProps);
  },
  text: (ctx: Content) => EqualTriangles.text(ctx, step9ASAProps.triangles),
  staticText: () => EqualTriangles.staticText(step9ASAProps.triangles),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };
  return ctx;
};

export const P4: LayoutProps = {
  questions: completeProof3,
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8, step9],
};
