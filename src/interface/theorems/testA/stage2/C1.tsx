import { Obj } from "geometry-object";
import { DiagramContent } from "../../../core/builder/DiagramContent";
import { comma, triangleStr } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { ShowPoint, SVGModes } from "../../../core/types/diagramTypes";
import { AspectRatio, LayoutProps } from "../../../core/types/layoutTypes";
import {
  StepFocusProps,
  StepMeta,
  StepProps,
} from "../../../core/types/stepTypes";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = () => {
  let ctx = new DiagramContent();
  const E = ctx.addPoint(
    { pt: [2, 2], label: "E" },
    [-15, -15],
    ShowPoint.Adaptive,
  );
  const F = ctx.addPoint(
    { pt: [2, 9], label: "F" },
    [-10, 5],
    ShowPoint.Adaptive,
  );
  const H = ctx.addPoint(
    { pt: [14, 2], label: "H" },
    [0, -17],
    ShowPoint.Adaptive,
  );
  const G = ctx.addPoint(
    { pt: [14, 9], label: "G" },
    [8, 0],
    ShowPoint.Adaptive,
  );
  const J = ctx.addPoint(
    { pt: [8, 2], label: "J" },
    [-5, -18],
    ShowPoint.Adaptive,
  );

  ctx.addTriangle({ pts: [E.obj, F.obj, J.obj] });
  ctx.addTriangle({ pts: [J.obj, G.obj, H.obj] }, true);
  ctx.addTriangle({ pts: [F.obj, G.obj, J.obj] });

  // for mini figures
  ctx.addAngle({ start: E.obj, center: F.obj, end: G.obj });
  ctx.addAngle({ start: F.obj, center: G.obj, end: H.obj });

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
    Midpoint.additions(props, "J", "EH");
  },
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, SVGModes.Derived);
    EqualSegments.additions(
      { ...props, mode: SVGModes.Derived },
      ["FJ", "GJ"],
      1,
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
    Midpoint.additions(props, "J", "EH");
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
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6, step7],
  title: "Prove Isosceles",
  diagramAspect: AspectRatio.Landscape,
};
