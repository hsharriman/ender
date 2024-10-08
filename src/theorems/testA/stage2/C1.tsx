import { Content } from "../../../core/diagramContent";
import { Angle } from "../../../core/geometry/Angle";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, triangleStr } from "../../../core/geometryText";
import { AspectRatio } from "../../../core/svg/svgTypes";
import { EqualAngles } from "../../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../../core/templates/EqualSegments";
import { EqualTriangles } from "../../../core/templates/EqualTriangles";
import { Midpoint } from "../../../core/templates/Midpoint";
import { RightAngle } from "../../../core/templates/RightAngle";
import { SAS, SASProps } from "../../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { exploratoryQuestion } from "../../../questions/funcTypeQuestions";
import { Reasons } from "../../reasons";
import { linked, makeStepMeta } from "../../utils";

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
  text: (ctx: Content) => {
    const EF = ctx.getSegment("EF");
    const FG = ctx.getSegment("FG");
    const GH = ctx.getSegment("GH");
    const EJ = ctx.getSegment("EJ");
    const HJ = ctx.getSegment("HJ");

    return (
      <span>
        {linked(
          "EFGH",
          new BaseGeometryObject(Obj.Quadrilateral, { hoverable: false }),
          [EF, FG, GH, EJ, HJ]
        )}
        {" is a rectangle"}
        {comma}
        {Midpoint.text(ctx, "EH", ["EJ", "HJ"], "J")}
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
  text: (ctx: Content) => {
    return (
      <span>
        {linked("FGJ", ctx.getTriangle("FGJ"))}
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
  text: (ctx: Content) => {
    return (
      <span>
        {linked(
          "EFGH",
          new BaseGeometryObject(Obj.Quadrilateral, { hoverable: false }), // TODO? hoverable?
          [
            ctx.getSegment("EF"),
            ctx.getSegment("FG"),
            ctx.getSegment("GH"),
            ctx.getSegment("EJ"),
            ctx.getSegment("JH"),
          ]
        )}
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
  text: (ctx: Content) => Midpoint.text(ctx, "EH", ["EJ", "JH"], "J"),
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
  text: (ctx: Content) => EqualSegments.text(ctx, ["EJ", "JH"]),
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
  text: (ctx: Content) => EqualRightAngles.text(ctx, ["FEJ", "JHG"]),
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
  text: (ctx: Content) => EqualSegments.text(ctx, ["FE", "GH"]),
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
  text: (ctx: Content) => EqualTriangles.text(ctx, step5SASProps.triangles),
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
  text: (ctx: Content) => EqualSegments.text(ctx, ["FJ", "GJ"]),
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
  text: (ctx: Content) => {
    return (
      <span>
        {linked("FGJ", ctx.getTriangle("FGJ"))}
        {" is isosceles "}
      </span>
    );
  },
  staticText: () => proves.staticText(),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
  };

  const step2 = ctx.addFrame("s3");
  Midpoint.additions(
    { ...defaultStepProps, frame: step2 },
    "J",
    ["EJ", "JH"],
    1,
    SVGModes.Blue
  );

  const step3 = ctx.addFrame("s4");
  const rectangleSegs = ["EF", "FG", "GH", "EJ", "JH"];
  rectangleSegs.map((s) => ctx.getSegment(s).mode(step3, SVGModes.Focused));
  const rectangleAngles = ["EFG", "FGH"];
  rectangleAngles.map((a) =>
    RightAngle.additions(
      { ...defaultStepProps, frame: step3, mode: SVGModes.Focused },
      a
    )
  );
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["FEJ", "JHG"],
    SVGModes.Blue
  );

  const step4 = ctx.addFrame("s5");
  const EH = ctx.push(
    new Segment({
      p1: ctx.getPoint("E"),
      p2: ctx.getPoint("H"),
      hoverable: false,
    })
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step4 },
    ["FE", "GH"],
    2,
    SVGModes.Blue
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step4, mode: SVGModes.Focused },
    ["FG", "EH"]
  );

  const step5 = ctx.addFrame("s6");
  SAS.additions(
    { ...defaultStepProps, frame: step5 },
    {
      seg1s: { s: ["EJ", "HJ"], ticks: 1 },
      seg2s: { s: ["FE", "GH"], ticks: 2 },
      angles: { a: ["FEJ", "JHG"], type: Obj.RightTick },
      triangles: ["FEJ", "JHG"],
    },
    SVGModes.Blue
  );

  const step6 = ctx.addFrame("s7");
  const s6Opts = { ...defaultStepProps, frame: step6, mode: SVGModes.Focused };
  EqualSegments.additions(s6Opts, ["EJ", "JH"], 1);
  EqualSegments.additions(s6Opts, ["FE", "GH"], 2);
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6 },
    ["FJ", "GJ"],
    3
  );
  EqualRightAngles.additions(s6Opts, ["FEJ", "JHG"]);
  EqualAngles.additions(s6Opts, ["EFJ", "JGH"], 2);
  EqualAngles.additions(s6Opts, ["FJE", "GJH"], 1);

  const step7 = ctx.addFrame("s8");
  ctx.getSegment("FG").mode(step7, SVGModes.Purple);
  EqualSegments.additions(
    { ...defaultStepProps, frame: step7 },
    ["FJ", "GJ"],
    1
  );
  return ctx;
};

export const T1_S2_C1: LayoutProps = {
  name: "T1_S2_C1",
  // TODO: Replace questions
  questions: exploratoryQuestion(3, 8),
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [step1, step2, step22, step3, step4, step5, step6, step7],
  title: "Prove Isosceles",
};
