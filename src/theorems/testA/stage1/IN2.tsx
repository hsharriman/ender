import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { checkingProof2 } from "../../../core/testinfra/questions/funcTypeQuestions";
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
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
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["JMK", "LMK"],
      SVGModes.Derived
    );
  },
  text: EqualTriangles.text(["JMK", "LMK"]),
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    Perpendicular.additions(props, "MK", ["JM", "ML"]);
  },
  text: Perpendicular.text("JL", "MK"),
  staticText: () => Perpendicular.staticText("JL", "MK"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["JK", "LK"]);
  },
  text: EqualSegments.text(["JK", "LK"]),
  staticText: () => EqualSegments.staticText(["JK", "LK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["JMK", "LMK"]);
  },
  text: EqualRightAngles.text(["JMK", "LMK"]),
  staticText: () => EqualRightAngles.staticText(["JMK", "LMK"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "MK", ["JM", "ML"], SVGModes.ReliesOn);
  },
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: Reflexive.text("MK"),
  staticText: () => Reflexive.staticText("MK"),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.AAS,
  dependsOn: ["2", "3", "4?"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["KJM", "KLM"],
      props.mode
    );
  },
  text: EqualTriangles.text(["JMK", "LMK"]),
  staticText: () => EqualTriangles.staticText(["JMK", "LMK"]),
  highlight: (ctx: Content, frame: string) => {
    EqualSegments.highlight(ctx, frame, ["JK", "LK"], SVGModes.ReliesOn);
    EqualRightAngles.highlight(ctx, frame, ["JMK", "LMK"], SVGModes.ReliesOn);
    EqualAngles.highlight(ctx, frame, ["KJM", "KLM"], SVGModes.Inconsistent);
  },
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
