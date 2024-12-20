import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { ShowPoint } from "../../../core/geometry/Point";
import { comma, triangleStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import {
  S2C1Questions,
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
  const [E, F, H, G, J] = ctx.addPoints([
    {
      pt: [2, 2],
      label: "E",
      offset: [-15, -15],
      showPoint: ShowPoint.Adaptive,
    },
    { pt: [2, 9], label: "F", offset: [-10, 5], showPoint: ShowPoint.Adaptive },
    {
      pt: [14, 2],
      label: "H",
      offset: [0, -17],
      showPoint: ShowPoint.Adaptive,
    },
    { pt: [14, 9], label: "G", offset: [8, 0], showPoint: ShowPoint.Adaptive },
    {
      pt: [8, 2],
      label: "J",
      offset: [-5, -18],
      showPoint: ShowPoint.Adaptive,
    },
  ]);

  ctx.addTriangles([
    { pts: [E, F, J] },
    { pts: [J, G, H], rotatePattern: true },
    { pts: [F, G, J] },
  ]);

  // for mini figures
  ctx.addAngles([
    { start: E, center: F, end: G },
    { start: F, center: G, end: H },
  ]);

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {"EFGH is a rectangle"}
        {comma}
        {Midpoint.text("J", "EH")(true)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    // props.ctx.getQuadrilateral("EFGH").mode(props.frame, props.mode);
    props.ctx.getTriangle("EFJ").mode(props.frame, props.mode);
    props.ctx.getTriangle("JGH").mode(props.frame, props.mode);
    props.ctx.getTriangle("FGJ").mode(props.frame, props.mode);
    props.ctx.getSegment("FJ").mode(props.frame, props.mode);
    props.ctx.getSegment("GJ").mode(props.frame, props.mode);
    Midpoint.additions(props, "J", ["EJ", "JH"]);
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, SVGModes.Derived);
    EqualSegments.additions(
      { ...props, mode: SVGModes.Derived },
      ["FJ", "GJ"],
      1
    );
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {triangleStr("FGJ")}
        {" is isosceles"}
      </span>
    );
  },
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("EF").mode(props.frame, props.mode);
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    props.ctx.getSegment("GH").mode(props.frame, props.mode);
    props.ctx.getSegment("EJ").mode(props.frame, props.mode);
    props.ctx.getSegment("JH").mode(props.frame, props.mode);
  },
  text: (isActive: boolean) => {
    return <span>EFGH is a rectangle</span>;
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "J", ["EJ", "JH"]);
  },
  text: Midpoint.text("J", "EH"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: ["2"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["EJ", "JH"]);
  },
  text: EqualSegments.text(["EJ", "JH"]),
  highlight: (props: StepProps) =>
    props.ctx.getPoint("J").mode(props.frame, SVGModes.ReliesOn),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: ["1"],
  prevStep: step22,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["FEJ", "JHG"]);
  },
  text: EqualRightAngles.text(["FEJ", "JHG"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FE", "GH"], 2);
  },
  text: EqualSegments.text(["FE", "GH"]),
});

const step5SASProps: SASProps = {
  seg1s: { s: ["EJ", "JH"], ticks: 1 },
  seg2s: { s: ["FE", "GH"], ticks: 2 },
  angles: { a: ["FEJ", "JHG"], type: Obj.RightTick },
  triangles: ["FEJ", "JHG"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["3", "4", "5"],
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    CongruentTriangles.congruentLabel(props, ["FEJ", "JHG"], props.mode);
  },
  text: EqualTriangles.text(step5SASProps.triangles),
  highlight: (props: StepProps) => {
    SAS.highlight(props, step5SASProps);
  },
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: ["6"],
  prevStep: step5,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: EqualSegments.text(["FJ", "GJ"]),
  highlight: (props: StepProps) => {
    CongruentTriangles.congruentLabel(props, ["FEJ", "JHG"], SVGModes.ReliesOn);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.Isosceles,
  dependsOn: ["7"],
  prevStep: step6,
  additions: (props: StepFocusProps) => {
    // TODO highlight FGJ, relies on FJ,GJ? and hide unfocused triangle congruence?
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: proves.text,
});

export const T1_S2_C1: LayoutProps = {
  name: "T1_S2_C1",
  questions: exploratoryQuestion(3, 8),
  shuffleQuestions: S2C1Questions,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6, step7],
  title: "Prove Isosceles",
};
