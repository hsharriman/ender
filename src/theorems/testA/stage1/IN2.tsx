import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { checkingProof2 } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 9], // J
      [9, 9], // L
      [5.5, 1], // K
      [5.5, 9], // M
    ],
  ];
  let ctx = new Content();
  const labels = ["J", "L", "K", "M"];
  const offsets: Vector[] = [
    [-15, -15],
    [8, -15],
    [-5, -17],
    [-5, 6],
  ];
  const pts = coords[0];
  const [J, L, K, M] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [J, M, K], hoverable, label: "JMK" }, ctx));
  ctx.push(new Triangle({ pts: [L, M, K], hoverable, label: "LMK" }, ctx));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("JL", "MK")(isActive)}
        {comma}
        {EqualSegments.text(["JK", "LK"])(isActive)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("JMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
  staticText: () => {
    return (
      <span>
        {Perpendicular.staticText("JL", "MK")}
        {comma}
        {EqualSegments.staticText(["JK", "LK"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  text: EqualTriangles.text(["JMK", "LMK"]),
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Perpendicular.additions(props, "MK", ["JM", "ML"]);
  },
  text: Perpendicular.text("JL", "MK"),
  staticText: () => Perpendicular.staticText("JL", "MK"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    const focusProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(focusProps);
    step1.additions(focusProps);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["JK", "LK"]);
  },
  text: EqualSegments.text(["JK", "LK"]),
  staticText: () => EqualSegments.staticText(["JK", "LK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["JMK", "LMK"]);
  },
  text: EqualRightAngles.text(["JMK", "LMK"]),
  staticText: () => EqualRightAngles.staticText(["JMK", "LMK"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: Reflexive.text("MK"),
  staticText: () => Reflexive.staticText("MK"),
});

const step5Labels: SASProps = {
  seg1s: { s: ["JK", "LK"], ticks: 1 },
  seg2s: { s: ["MK", "MK"], ticks: 2 },
  angles: { a: ["JMK", "LMK"], type: Obj.RightTick },
  triangles: ["JMK", "LMK"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 3, 4],
  additions: (props: StepFocusProps) => {
    SAS.additions(props, step5Labels);
  },
  text: EqualTriangles.text(["JMK", "LMK"]),
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
});

export const T1_S1_IN2: LayoutProps = {
  name: "T1_S1_IN2",
  questions: checkingProof2,
  baseContent,
  steps: [step1, step2, step3, step4, step5],
  givens,
  proves,
  title: "Prove Triangles Congruent #2[M]",
};
