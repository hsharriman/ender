import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { RightAngle } from "../../../core/reasons/RightAngle";
import {
  IN3questions,
  exploratoryQuestion,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = () => {
  let ctx = new Content();
  const [L, M, K, N] = ctx.addPoints([
    { pt: [2, 2], label: "L", offset: [-15, -15] },
    { pt: [2, 9], label: "M", offset: [-10, 5] },
    { pt: [14, 2], label: "K", offset: [0, -17] },
    { pt: [14, 9], label: "N", offset: [8, 0] },
  ]);
  ctx.addTriangles([
    { pts: [L, M, K], label: "KLM" },
    { pts: [K, N, M], label: "MNK", rotatePattern: true },
  ]);

  // for mini figures
  ctx.addAngles([
    { start: L, center: M, end: N },
    { start: L, center: K, end: N },
  ]);

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {"KLMN is a quadrilateral"}
        {comma}
        {EqualSegments.text(["LM", "NK"])(true)}
        {comma}
        {RightAngle.text("KLM")(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("KMN").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["LM", "NK"]);
    RightAngle.additions(props, "KLM");
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["KLM", "MNK"], SVGModes.Derived);
  },
  text: (active: boolean) => EqualTriangles.text(["KLM", "MNK"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    ["LK", "LM", "MN", "NK"].map((s) =>
      props.ctx.getSegment(s).mode(props.frame, props.mode)
    );
  },
  text: (isActive: boolean) => {
    return <span>{"KLMN is a quadrilateral"}</span>;
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["LM", "NK"]);
  },
  text: EqualSegments.text(["LM", "NK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "KLM");
  },
  text: RightAngle.text("KLM"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Quadrilateral,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["KLM", "MNK"]);
  },
  text: EqualRightAngles.text(["KLM", "MNK"]),
  highlight: (props: StepProps) => {
    const { ctx, frame } = props;
    ctx.getSegment("LM").mode(frame, SVGModes.ReliesOn);
    ctx.getSegment("NK").mode(frame, SVGModes.ReliesOn);
    ctx.getSegment("LK").mode(frame, SVGModes.ReliesOn);
    ctx.getSegment("MN").mode(frame, SVGModes.ReliesOn);
    EqualRightAngles.highlight(props, ["KLM", "MNK"], SVGModes.Inconsistent);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: Reflexive.text("MK"),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.RHL,
  dependsOn: ["2", "4", "5"],
  prevStep: step5,
  text: EqualTriangles.text(["KLM", "MNK"]),
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["KLM", "MNK"], props.mode);
  },
  highlight: (props: StepProps) => {
    EqualSegments.highlight(props, ["LM", "NK"], SVGModes.ReliesOn);
    EqualRightAngles.highlight(props, ["KLM", "MNK"], SVGModes.ReliesOn);
    EqualSegments.highlight(props, ["MK", "MK"], SVGModes.ReliesOn, 2);
  },
});

export const T1_S1_IN3: LayoutProps = {
  name: "T1_S1_IN3",
  questions: exploratoryQuestion(4, 6),
  shuffleQuestions: IN3questions,
  baseContent,
  steps: [step1, step2, step3, step4, step5, step6],
  givens,
  proves,
  title: "Prove Rectangle[M]",
};
