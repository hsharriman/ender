import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { incompleteProof2 } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 10], //Q
      [8, 5.5], //R
      [14, 5.5], //M
      [14, 1], //N
      [2, 5.5], //P
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

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (isActive: boolean) => {
    const PeqM = EqualRightAngles.text(["QPR", "RMN"])(isActive);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.text("PM", "R")(isActive)}
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
  text: Midpoint.text("QN", "R"),
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
  text: EqualRightAngles.text(["QPR", "RMN"]),
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
  text: Midpoint.text("PM", "R"),
  staticText: () => Midpoint.staticText("R", "PM"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: [2],
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["PR", "RM"]);
  },
  text: EqualSegments.text(["PR", "RM"]),
  staticText: () => EqualSegments.staticText(["PR", "RM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  unfocused: (props: StepUnfocusProps) => {
    step22.additions({ ...props, mode: SVGModes.Unfocused });
    step22.unfocused(props);
  },
  text: EqualAngles.text(["QRP", "MRN"]),
  staticText: () => EqualAngles.staticText(["QRP", "MRN"]),
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["QRP", "MRN"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [1, 3, 4],
  text: EqualTriangles.text(["QPR", "RMN"]),
  staticText: () => EqualTriangles.staticText(["QPR", "RMN"]),

  additions: (props: StepFocusProps) => {
    givens.additions(props);
    step1.additions(props);
    step2.additions(props);
    step3.additions(props);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["QR", "RN"], 2);
  },
  text: EqualSegments.text(["QR", "RN"]),
  staticText: () => EqualSegments.staticText(["QR", "RN"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step5.unfocused(props);
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["QR", "NR"], 2);
  },
  text: Midpoint.text("QN", "R"),
  staticText: () => Midpoint.staticText("R", "QN"),
});

export const T1_S1_C3: LayoutProps = {
  name: "T1_S1_C3",
  questions: incompleteProof2,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6],
  title: "Prove Midpoint #2",
};
