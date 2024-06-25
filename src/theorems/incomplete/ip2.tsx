import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegmentStep } from "../../core/templates/EqualSegments";
import { Midpoint } from "../../core/templates/Midpoint";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../core/types/types";
import { incompleteProof2 } from "../../questions/funcTypeQuestions";
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

const step2: StepMeta = EqualSegmentStep(["PR", "RM"], Reasons.Given, step1);

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (props: StepTextProps) => (
    <span style={{ color: "black", fontStyle: "italic" }}>
      Which step can be applied here?
    </span>
  ),
  staticText: () => (
    <span style={{ fontStyle: "italic" }}>Which step can be applied here?</span>
  ),
});

// const step4: StepMeta = makeStepMeta({
//   reason: Reasons.Empty,
//   unfocused: (props: StepUnfocusProps) => {
//     step3.additions({ ...props, mode: SVGModes.Unfocused });
//     step3.unfocused(props);
//   },
//   text: (props: StepTextProps) => (
//     <span style={{ color: "black", fontStyle: "italic" }}>
//       Which step can be applied here?
//     </span>
//   ),
//   staticText: () => (
//     <span style={{ fontStyle: "italic" }}>Which step can be applied here?</span>
//   ),
// });

// const step5: StepMeta = makeStepMeta({
//   reason: Reasons.CorrespondingSegments,
//   dependsOn: [4],
//   unfocused: (props: StepUnfocusProps) => {
//     step4.additions({ ...props, mode: SVGModes.Unfocused });
//   },
//   additions: (props: StepFocusProps) => {
//     EqualSegments.additions(props, ["QR", "RN"], 2);
//   },
//   text: (props: StepTextProps) => {
//     return EqualSegments.text(props, ["QR", "RN"], 2);
//   },
//   staticText: () => EqualSegments.staticText(["QR", "RN"]),
// });

// const step6: StepMeta = makeStepMeta({
//   reason: Reasons.Midpoint,
//   dependsOn: [5],
//   unfocused: (props: StepUnfocusProps) => {
//     step5.unfocused(props);
//     step5.additions({ ...props, mode: SVGModes.Unfocused });
//   },
//   additions: (props: StepFocusProps) => {
//     Midpoint.additions(props, "R", ["QR", "NR"], 2);
//   },
//   text: (props: StepTextProps) =>
//     Midpoint.text(props, "QN", ["QR", "NR"], "R", 2),
//   staticText: () => Midpoint.staticText("R", "QN"),
// });

const miniContent = () => {
  let ctx = baseContent(false, false);
  return ctx;
};

export const IP2: LayoutProps = {
  questions: incompleteProof2,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3],
};
