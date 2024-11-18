import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { RightAngle } from "../../../core/reasons/RightAngle";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { checkingProof3 } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const pts: Vector[] = [
    [2, 2], // L BL
    [2, 9], // M TL
    [14, 2], // K BR
    [14, 9], // N TR
  ];
  let ctx = new Content();
  const labels = ["L", "M", "K", "N"];
  const offsets: Vector[] = [
    [-15, -15],
    [-10, 5],
    [0, -17],
    [8, 0],
  ];
  const [L, M, K, N] = pts.map((c, i) => {
    // TODO option to make point labels invisible
    return ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        hoverable,
      })
    );
  });
  ctx.push(new Triangle({ pts: [L, M, K], hoverable, label: "KLM" }, ctx));
  ctx.push(new Triangle({ pts: [K, N, M], hoverable, label: "MNK" }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: L, center: M, end: N, hoverable }));
  ctx.push(new Angle({ start: L, center: K, end: N, hoverable }));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return givens.staticText();
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("KMN").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {"KLMN is a quadrilateral"}
        {comma}
        {EqualSegments.staticText(["LM", "NK"])}
        {comma}
        {RightAngle.staticText("KLM")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  text: EqualTriangles.text(["KLM", "MNK"]),
  staticText: () => EqualTriangles.staticText(["KLM", "MNK"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ["LK", "LM", "MN", "NK"].map((s) =>
      props.ctx.getSegment(s).mode(props.frame, props.mode)
    );
  },
  text: (isActive: boolean) => {
    return step1.staticText();
  },
  staticText: () => <span>{"KLMN is a quadrilateral"}</span>,
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["LM", "NK"]);
  },
  text: EqualSegments.text(["LM", "NK"]),
  staticText: () => EqualSegments.staticText(["LM", "NK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "KLM");
  },
  text: RightAngle.text("KLM"),
  staticText: () => RightAngle.staticText("KLM"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Quadrilateral,
  dependsOn: ["1"],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["KLM", "MNK"]);
  },
  text: EqualRightAngles.text(["KLM", "MNK"]),
  staticText: () => {
    return EqualRightAngles.staticText(["KLM", "MNK"]);
  },
  highlight: (ctx: Content, frame: string) => {
    ctx.getSegment("LM").highlight(frame);
    ctx.getSegment("NK").highlight(frame);
    ctx.getSegment("LK").highlight(frame);
    ctx.getSegment("MN").highlight(frame);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step4.unfocused(props);
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: Reflexive.text("MK"),
  staticText: () => Reflexive.staticText("MK"),
  highlight: (ctx: Content, frame: string) =>
    Reflexive.highlight(ctx, frame, "MK", 2),
});

const s6SASProps: SASProps = {
  seg1s: { s: ["LM", "KN"], ticks: 1 },
  seg2s: { s: ["MK", "MK"], ticks: 2 },
  angles: { a: ["KLM", "MNK"], type: Obj.RightTick },
  triangles: ["KLM", "MNK"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.RHL,
  dependsOn: ["2", "4", "5"],
  additions: (props: StepFocusProps) => {
    SAS.additions(props, s6SASProps);
  },
  text: EqualTriangles.text(s6SASProps.triangles),
  staticText: () => EqualTriangles.staticText(s6SASProps.triangles),
  highlight: (ctx: Content, frame: string) => {
    EqualSegments.highlight(ctx, frame, ["LM", "NK"]);
    EqualRightAngles.highlight(ctx, frame, ["KLM", "MNK"]);
    EqualSegments.highlight(ctx, frame, ["MK", "MK"], 2);
  },
});

export const T1_S1_IN3: LayoutProps = {
  name: "T1_S1_IN3",
  questions: checkingProof3,
  baseContent,
  steps: [step1, step2, step3, step4, step5, step6],
  givens,
  proves,
  title: "Prove Rectangle[M]",
};
