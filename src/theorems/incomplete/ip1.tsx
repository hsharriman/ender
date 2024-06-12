import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { linked, makeStepMeta } from "../utils";
import { comma, segmentStr } from "../../core/geometryText";
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
import { incompleteProof1 } from "../../questions/incompleteQuestions";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [2, 4], //A
      [0, 1], //B
      [2, 0], //C
      [4, 1], //D
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

  ctx.push(new Triangle({ pts: [A, B, C], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [A, C, D], parentFrame }, ctx));

  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    return (
      <span>
        {EqualSegments.text(props, ["AB", "AD"])}
        {comma}
        {EqualSegments.text(props, ["BC", "DC"], 2)}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    return (
      <span>
        {EqualSegments.ticklessText(ctx, ["AB", "AD"])}
        {comma}
        {EqualSegments.ticklessText(ctx, ["BC", "DC"])}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AB", "AD"])}
        {comma}
        {EqualSegments.staticText(["BC", "DC"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABC").mode(props.frame, props.mode);
    props.ctx.getTriangle("ADC").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAC", "DAC"]);
  },
  text: (props: StepTextProps) => EqualAngles.text(props, ["BAC", "DAC"]),
  staticText: () => EqualAngles.staticText(["BAC", "DAC"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "AD"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["AB", "AD"]);
  },
  staticText: () => EqualSegments.staticText(["AB", "AD"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.additions({ ...props, mode: SVGModes.Unfocused });
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["BC", "DC"], 2);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["BC", "DC"], 2);
  },
  staticText: () => EqualSegments.staticText(["BC", "DC"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AC", "AC"], 3);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["AC", "AC"], 3);
  },
  staticText: () => EqualSegments.staticText(["AC", "AC"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
});

const miniContent = () => {
  let ctx = baseContent(false);
  return ctx;
};

export const IP1: LayoutProps = {
  questions: incompleteProof1,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5],
};
