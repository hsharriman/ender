import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Angle } from "../../core/geometry/Angle";
import { Triangle } from "../../core/geometry/Triangle";
import { makeStepMeta } from "../utils";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { Midpoint } from "../../core/templates/Midpoint";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { Reasons } from "../reasons";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { VerticalAngles } from "../../core/templates/VerticalAngles";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { ASAAngleMeta, ASAProps, ASA } from "../../core/templates/ASA";
import { incompleteProof2a } from "../../questions/incompleteQuestions";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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
    [-15, -15],
    [0, 5],
    [0, -17],
    [-5, -18],
    [0, 0],
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
        parentFrame: parentFrame,
      })
    )
  );

  ctx.push(new Triangle({ pts: [Q, P, R], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [R, M, N], parentFrame }, ctx));

  // for given step:
  ctx.push(new Angle({ start: Q, center: P, end: R }));
  ctx.push(new Angle({ start: R, center: M, end: N }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (props: StepTextProps) => {
    const PeqM = EqualRightAngles.text(props, ["QPR", "RMN"]);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.text(props, "PM", ["PR", "MR"], "R")}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const PeqM = EqualRightAngles.ticklesstText(ctx, ["QPR", "RMN"]);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.ticklessText(ctx, "PM", ["PR", "MR"], "R")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("QRP").mode(props.frame, props.mode);
    props.ctx.getTriangle("MRN").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
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
  text: (props: StepTextProps) => {
    return Midpoint.text(props, "QN", ["QR", "NR"], "R");
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
  text: (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["QPR", "RMN"]);
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
    EqualSegments.additions(props, ["PR", "RM"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["PR", "RM"]);
  },
  staticText: () => EqualSegments.staticText(["PR", "RM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["QRP", "MRN"]);
  },
  text: (props: StepTextProps) => EqualAngles.text(props, ["QRP", "MRN"]),
  staticText: () => EqualAngles.staticText(["QRP", "MRN"]),
});

const step4ASAAngleMeta1: ASAAngleMeta = {
  angles: ["QRP", "MRN"],
  tick: Obj.EqualAngleTick,
};
const step4ASAAngleMeta2: ASAAngleMeta = {
  angles: ["QPR", "RMN"],
  tick: Obj.RightTick,
};
const step4SASProps: ASAProps = {
  a1s: step4ASAAngleMeta1,
  a2s: step4ASAAngleMeta2,
  segs: ["PR", "RM"],
  triangles: ["QRP", "MRN"],
};
const step4: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [1, 2, 3],
  unfocused: (props: StepUnfocusProps) => {
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step4SASProps);
  },
  text: (props: StepTextProps) => ASA.text(props, step4SASProps),
  staticText: () => EqualTriangles.staticText(["QRP", "MRN"]),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingSegments,
  dependsOn: [4],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["QR", "RN"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["QR", "RN"]);
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
    Midpoint.additions(props, "R", ["QR", "NR"]);
  },
  text: (props: StepTextProps) =>
    Midpoint.text(props, "QN", ["QR", "NR"], "R", 2),
  staticText: () => Midpoint.staticText("R", "QN"),
});

const miniContent = () => {
  let ctx = baseContent(false);
  return ctx;
};

export const IP2: LayoutProps = {
  questions: incompleteProof2a,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6],
};
