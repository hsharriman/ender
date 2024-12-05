import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point, ShowPoint } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
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
import { StepFocusProps, StepMeta } from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 2],
      [2, 9],
      [14, 2],
      [14, 9],
      [8, 2],
    ],
  ];
  let ctx = new Content();
  const labels = ["E", "F", "H", "G", "J"];
  const offsets: Vector[] = [
    [-15, -15],
    [-10, 5],
    [0, -17],
    [8, 0],
    [-5, -18],
  ];
  const pts = coords[0];
  const [E, F, H, G, J] = pts.map((c, i) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        hoverable,
        showPoint: ShowPoint.Adaptive,
      })
    )
  );
  // ctx.push(new Quadrilateral({ pts: [E, F, G, H], parentFrame }, ctx));

  ctx.push(new Triangle({ pts: [E, F, J], hoverable, label: "FEJ" }, ctx));
  ctx.push(
    new Triangle(
      { pts: [J, G, H], hoverable, label: "JHG", rotatePattern: true },
      ctx
    )
  );
  ctx.push(new Triangle({ pts: [F, G, J], hoverable, label: "FGJ" }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: E, center: F, end: G, hoverable }));
  ctx.push(new Angle({ start: F, center: G, end: H, hoverable }));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return givens.staticText();
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

  staticText: () => {
    return (
      <span>
        {"EFGH is a rectangle"}
        {comma}
        {Midpoint.staticText("J", "EH")}
      </span>
    );
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
    return proves.staticText();
  },
  staticText: () => {
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
    return step1.staticText();
  },
  staticText: () => <span>EFGH is a rectangle</span>,
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "J", ["EJ", "JH"]);
  },
  text: Midpoint.text("J", "EH"),
  staticText: () => Midpoint.staticText("J", "EH"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: ["2"],
  prevStep: step2,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["EJ", "JH"]);
  },
  text: EqualSegments.text(["EJ", "JH"]),
  staticText: () => EqualSegments.staticText(["EJ", "JH"]),
  highlight: (ctx: Content, frame: string) =>
    ctx.getPoint("J").mode(frame, SVGModes.ReliesOn),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: ["1"],
  prevStep: step22,
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["FEJ", "JHG"]);
  },
  text: EqualRightAngles.text(["FEJ", "JHG"]),
  staticText: () => EqualRightAngles.staticText(["FEJ", "JHG"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: ["1"],
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FE", "GH"], 2);
  },
  text: EqualSegments.text(["FE", "GH"]),
  staticText: () => EqualSegments.staticText(["FE", "GH"]),
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
    CongruentTriangles.congruentLabel(
      props.ctx,
      props.frame,
      ["FEJ", "JHG"],
      props.mode
    );
  },
  text: EqualTriangles.text(step5SASProps.triangles),
  staticText: () => EqualTriangles.staticText(step5SASProps.triangles),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, step5SASProps);
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
  staticText: () => EqualSegments.staticText(["FJ", "GJ"]),
  highlight: (ctx: Content, frame: string) => {
    SAS.highlight(ctx, frame, step5SASProps); // TODO should be CongruentTriangles
    CongruentTriangles.congruentLabel(
      ctx,
      frame,
      ["FEJ", "JHG"],
      SVGModes.ReliesOn
    );
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.Isosceles,
  dependsOn: ["7"],
  prevStep: step6,
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: (isActive: boolean) => {
    return step7.staticText();
  },
  staticText: () => proves.staticText(),
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
