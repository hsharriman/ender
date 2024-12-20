import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { comma } from "../../../core/geometryText";
import { ASA, ASAProps } from "../../../core/reasons/ASA";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngleStep, EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import {
  S2IN1Questions,
  exploratoryQuestion,
} from "../../../core/testinfra/questions/testQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = () => {
  let ctx = new Content();
  const [L, S, U, R, N, Q, P] = ctx.addPoints([
    { pt: [2, 1], label: "L", offset: [-15, -15] },
    { pt: [6, 1], label: "S", offset: [-5, -18] },
    { pt: [10, 1], label: "U", offset: [0, -17] },
    { pt: [6, 2.85], label: "R", offset: [6, 12] },
    { pt: [3.5, 4], label: "N", offset: [-16, 0] },
    { pt: [8.5, 4], label: "Q", offset: [5, 5] },
    { pt: [6, 9], label: "P", offset: [8, -10] },
  ]);

  ctx.addTriangles([
    { pts: [L, P, S] },
    { pts: [U, P, S], rotatePattern: true },
    { pts: [L, N, U], rotatePattern: true },
    { pts: [U, Q, L] },
  ]);

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("LU", "PS")(true)}
        {comma}
        {EqualSegments.text(["LN", "QU"])(true)}
        {comma}
        {EqualAngles.text(["LPS", "UPS"])(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LPS").mode(props.frame, props.mode);
    props.ctx.getTriangle("LNU").mode(props.frame, props.mode);
    props.ctx.getTriangle("UQL").mode(props.frame, props.mode);
    props.ctx.getTriangle("UPS").mode(props.frame, props.mode);
    Perpendicular.additions(props, "PS", ["LS", "SU"]);
    EqualSegments.additions(props, ["LN", "QU"]);
    EqualAngles.additions(props, ["LPS", "UPS"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["LNU", "UQL"], SVGModes.Derived);
    props.ctx.getTriangle("LNU").mode(props.frame, SVGModes.Derived);
    props.ctx.getTriangle("UQL").mode(props.frame, SVGModes.Derived);
  },
  text: (active: boolean) => EqualTriangles.text(["LNU", "UQL"])(true),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "PS", ["LS", "SU"]),
  text: Perpendicular.text("LU", "PS"),
});

const step2: StepMeta = EqualSegmentStep(["LN", "QU"], Reasons.Given, step1);

const step3: StepMeta = EqualAngleStep(["LPS", "UPS"], Reasons.Given, step2);

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["PSL", "PSU"]),
  text: EqualRightAngles.text(["PSL", "PSU"]),
  highlight: (props: StepProps) => {
    Perpendicular.highlight(props, "PS", ["LS", "SU"], SVGModes.ReliesOn);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "PS", 2);
  },
  text: Reflexive.text("PS"),
});

const step6ASAProps: ASAProps = {
  a1s: { a: ["PSL", "PSU"], type: Obj.RightTick },
  a2s: { a: ["LPS", "UPS"], type: Obj.EqualAngleTick },
  segs: { s: ["PS", "PS"], ticks: 2 },
  triangles: ["LSP", "USP"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["3", "4", "5"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["LSP", "USP"], props.mode);
  },
  text: EqualTriangles.text(step6ASAProps.triangles),
  highlight: (props: StepProps) => {
    ASA.highlight(props, step6ASAProps);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  unfocused: (props: StepProps) => {
    // step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["SLP", "SUP"], 2);
  },
  text: EqualAngles.text(["SLP", "SUP"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["LSP", "USP"], SVGModes.ReliesOn);
  },
});

const step9ASAProps: ASAProps = {
  a1s: { a: ["ULN", "LUQ"], type: Obj.EqualAngleTick, ticks: 2 },
  a2s: { a: ["LNU", "UQL"], type: Obj.EqualAngleTick, ticks: 3 },
  segs: { s: ["LN", "QU"] },
  triangles: ["LNU", "UQL"],
};
// INCORRECT VERSION -- Correct would be reflexive LU
const step8: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6?"],
  prevStep: step7,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["LNU", "UQL"], 3);
  },
  text: EqualAngles.text(["LNU", "UQL"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(
      props,
      ["LNU", "UQL"],
      SVGModes.Inconsistent
    );
  },
});

// INCORRECT VERSION -- Correct would be SAS
const step9: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: ["2", "7", "8"],
  prevStep: step8,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["LNU", "UQL"], props.mode);
  },
  text: EqualTriangles.text(step9ASAProps.triangles),
  highlight: (props: StepProps) => {
    ASA.highlight(props, step9ASAProps);
  },
});

export const T1_S2_IN1: LayoutProps = {
  name: "T1_S2_IN1",
  questions: exploratoryQuestion(4, 9),
  shuffleQuestions: S2IN1Questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8, step9],
  title: "Triangle Congruence #3 [M]",
};
