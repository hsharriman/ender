import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { ASA, ASAProps } from "../../core/templates/ASA";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Midpoint } from "../../core/templates/Midpoint";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { incompleteProof2 } from "../../questions/incompleteQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [0, 4.5], //Q
      [3, 2], //R
      [6, 2], //M
      [6, -0.5], //N
      [0, 2], //P
    ],
  ];
  let ctx = new Content();
  const labels = ["Q", "R", "M", "N", "P"];
  const offsets: Vector[] = [
    [-18, -15],
    [0, 5],
    [5, -8],
    [5, 0],
    [-15, -8],
  ];
  const pts = coords[0];
  const [Q, R, M, N, P] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [Q, P, R], hoverable, label: "QPR" }, ctx));
  ctx.push(new Triangle({ pts: [R, M, N], hoverable, label: "RMN" }, ctx));

  // for given step:
  ctx.push(new Angle({ start: Q, center: P, end: R, hoverable }));
  ctx.push(new Angle({ start: R, center: M, end: N, hoverable }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (ctx: Content) => {
    const PeqM = EqualRightAngles.text(ctx, ["QPR", "RMN"]);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.text(ctx, "PM", ["PR", "MR"], "R")}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("QRP").mode(props.frame, props.mode);
    props.ctx.getTriangle("MRN").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
  staticText: () => {
    return (
      <span>
        {EqualRightAngles.staticText(["QPR", "RMN"])}
        {comma}
        {Midpoint.staticText("R", "PM")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["QR", "NR"]);
  },
  text: (ctx: Content) => {
    return Midpoint.text(ctx, "QN", ["QR", "NR"], "R");
  },
  staticText: () => Midpoint.staticText("R", "QN"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["QPR", "RMN"]);
  },
  text: (ctx: Content) => {
    return EqualRightAngles.text(ctx, ["QPR", "RMN"]);
  },
  staticText: () => EqualRightAngles.staticText(["QPR", "RMN"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
  text: (ctx: Content) => {
    return Midpoint.text(ctx, "PM", ["PR", "RM"], "R");
  },
  staticText: () => Midpoint.staticText("R", "PM"),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  text: (ctx: Content) => EqualAngles.text(ctx, ["QRP", "MRN"]),
  staticText: () => EqualAngles.staticText(["QRP", "MRN"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["QRP", "MRN"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [1, 2, 3],
  text: (ctx: Content) => EqualTriangles.text(ctx, ["QPR", "RMN"]),
  staticText: () => EqualTriangles.staticText(["QPR", "RMN"]),

  additions: (props: StepFocusProps) => {
    givens.additions(props);
    step1.additions(props);
    step2.additions(props);
    step3.additions(props);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingSegments,
  dependsOn: [4],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["QR", "RN"], 2);
  },
  text: (ctx: Content) => {
    return EqualSegments.text(ctx, ["QR", "RN"]);
  },
  staticText: () => EqualSegments.staticText(["QR", "RN"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step5.unfocused(props);
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["QR", "NR"], 2);
  },
  text: (ctx: Content) => Midpoint.text(ctx, "QN", ["QR", "NR"], "R"),
  staticText: () => Midpoint.staticText("R", "QN"),
});

const miniContent = () => {
  let ctx = baseContent(false, false);
  const defaultProps = { ctx, frame: "", mode: SVGModes.Purple };

  // VERTICAL ANGLES
  const step3 = ctx.addFrame("s3");
  ctx.getSegment("QR").mode(step3, SVGModes.Focused);
  ctx.getSegment("RN").mode(step3, SVGModes.Focused);
  ctx.getSegment("PR").mode(step3, SVGModes.Focused);
  ctx.getSegment("RM").mode(step3, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultProps, frame: step3 },
    ["QRP", "MRN"],
    1,
    SVGModes.Blue
  );
  // ASA
  const step4 = ctx.addFrame("s4");
  const asaProps: ASAProps = {
    a1s: { a: ["QRP", "MRN"], type: Obj.EqualAngleTick },
    a2s: { a: ["QPR", "NMR"], type: Obj.RightTick },
    segs: { s: ["PR", "RM"] },
    triangles: ["QPR", "RMN"],
  };
  ASA.additions({ ...defaultProps, frame: step4 }, asaProps, SVGModes.Blue);
  // CORRESPONDING SEGMENTS
  const step5 = ctx.addFrame("s5");
  const s5props = { ctx, mode: SVGModes.Focused, frame: step5 };
  EqualSegments.additions(
    { ...defaultProps, frame: step5 },
    ["QR", "RN"],
    2,
    SVGModes.Blue
  );
  EqualSegments.additions(s5props, ["PR", "RM"], 1);
  EqualSegments.additions(s5props, ["QP", "MN"], 3);
  EqualAngles.additions(s5props, ["QRP", "MRN"], 1);
  EqualRightAngles.additions(s5props, ["QPR", "NMR"]);
  EqualAngles.additions(s5props, ["PQR", "MNR"], 2);

  // MIDPOINT
  const step6 = ctx.addFrame("s6");
  Midpoint.additions(
    { ...defaultProps, frame: step6 },
    "R",
    ["QR", "NR"],
    2,
    SVGModes.Blue
  );
  return ctx;
};

export const IP2: LayoutProps = {
  questions: incompleteProof2,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6],
};
