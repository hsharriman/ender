import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, triangleStr } from "../../../core/geometryText";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { exploratoryQuestion } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { BGColors, chipText, makeStepMeta } from "../../utils";

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
      })
    )
  );
  // ctx.push(new Quadrilateral({ pts: [E, F, G, H], parentFrame }, ctx));

  ctx.push(new Triangle({ pts: [E, F, J], hoverable, label: "FEJ" }, ctx));
  ctx.push(new Triangle({ pts: [J, G, H], hoverable, label: "JHG" }, ctx));
  ctx.push(new Triangle({ pts: [F, G, J], hoverable, label: "FGJ" }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: E, center: F, end: G, hoverable }));
  ctx.push(new Angle({ start: F, center: G, end: H, hoverable }));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Quadrilateral, "EFGH", BGColors.Blue, isActive)}
        {" is a rectangle"}
        {comma}
        {Midpoint.text("EH", "J")(isActive)}
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
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
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
  unfocused: (props: StepUnfocusProps) => {
    props.ctx.getSegment("EF").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("GH").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("EJ").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("HJ").mode(props.frame, SVGModes.Unfocused);
  },
  additions: (props: StepFocusProps) => {
    // TODO why is this unfocused?
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    props.ctx.getSegment("GJ").mode(props.frame, props.mode);
    props.ctx.getSegment("FJ").mode(props.frame, props.mode);
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Triangle, "FGJ", BGColors.Blue, isActive)}
        {" is isosceles"}
      </span>
    );
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
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("EF").mode(props.frame, props.mode);
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    props.ctx.getSegment("GH").mode(props.frame, props.mode);
    props.ctx.getSegment("EJ").mode(props.frame, props.mode);
    props.ctx.getSegment("JH").mode(props.frame, props.mode);
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Quadrilateral, "EFGH", BGColors.Blue, isActive)}
        {" is a rectangle"}
      </span>
    );
  },
  staticText: () => <span>EFGH is a rectangle</span>,
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "J", ["EJ", "JH"]);
  },
  text: Midpoint.text("EH", "J"),
  staticText: () => Midpoint.staticText("J", "EH"),
});

const step22: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: [2],
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["EJ", "JH"]);
  },
  text: EqualSegments.text(["EJ", "JH"]),
  staticText: () => EqualSegments.staticText(["EJ", "JH"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step22.additions({ ...props, mode: SVGModes.Unfocused });
    step22.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["FEJ", "JHG"]);
  },
  text: EqualRightAngles.text(["FEJ", "JHG"]),
  staticText: () => EqualRightAngles.staticText(["FEJ", "JHG"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
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
  dependsOn: [3, 4, 5],
  unfocused: (props: StepUnfocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, SVGModes.Unfocused);
  },
  additions: (props: StepFocusProps) => {
    SAS.additions(props, step5SASProps);
  },
  text: EqualTriangles.text(step5SASProps.triangles),
  staticText: () => EqualTriangles.staticText(step5SASProps.triangles),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: EqualSegments.text(["FJ", "GJ"]),
  staticText: () => EqualSegments.staticText(["FJ", "GJ"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.Isosceles,
  dependsOn: [7],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Triangle, "FGJ", BGColors.Blue, isActive)}
        {" is isosceles "}
      </span>
    );
  },
  staticText: () => proves.staticText(),
});

export const T1_S2_C1: LayoutProps = {
  name: "T1_S2_C1",
  // TODO: Replace questions
  questions: exploratoryQuestion(3, 8),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6, step7],
  title: "Prove Isosceles",
};
