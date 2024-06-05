import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { BaseGeometryObject } from "../../core/geometry/BaseGeometryObject";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { comma, triangleStr } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Midpoint } from "../../core/templates/Midpoint";
import { RightAngle } from "../../core/templates/RightAngle";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { completeProof3 } from "../../questions/completeQuestions";
import { Reasons } from "../reasons";
import { linked, makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [1, 0],
      [1, 3],
      [6, 0],
      [6, 3],
      [3.5, 0],
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
        parentFrame: parentFrame,
      })
    )
  );
  // ctx.push(new Quadrilateral({ pts: [E, F, G, H], parentFrame }, ctx));

  ctx.push(new Triangle({ pts: [E, F, J], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [J, G, H], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [F, G, J], parentFrame }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: E, center: F, end: G }));
  ctx.push(new Angle({ start: F, center: G, end: H }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    const EF = props.ctx.getSegment("EF");
    const FG = props.ctx.getSegment("FG");
    const GH = props.ctx.getSegment("GH");
    const EJ = props.ctx.getSegment("EJ");
    const HJ = props.ctx.getSegment("HJ");

    return (
      <span>
        {linked("EFGH", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          EF,
          FG,
          GH,
          EJ,
          HJ,
        ])}
        {" is a rectangle"}
        {comma}
        {Midpoint.text(props, "EH", ["EJ", "HJ"], "J")}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const EF = ctx.getSegment("EF");
    const FG = ctx.getSegment("FG");
    const GH = ctx.getSegment("GH");
    const EJ = ctx.getSegment("EJ");
    const HJ = ctx.getSegment("HJ");

    return (
      <span>
        {linked("EFGH", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          EF,
          FG,
          GH,
          EJ,
          HJ,
        ])}
        {" is a rectangle"}
        {comma}
        {Midpoint.ticklessText(ctx, "EH", ["EJ", "HJ"], "J")}
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
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
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
  text: (props: StepTextProps) => {
    return (
      <span>
        {linked("FGJ", props.ctx.getTriangle("FGJ"))}
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
  text: (props: StepTextProps) => {
    return (
      <span>
        {linked("EFGH", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          props.ctx.getSegment("EF"),
          props.ctx.getSegment("FG"),
          props.ctx.getSegment("GH"),
          props.ctx.getSegment("EJ"),
          props.ctx.getSegment("JH"),
        ])}
        {" is a rectangle"}
      </span>
    );
  },
  staticText: () => givens.staticText(),
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
  text: (props: StepTextProps) => Midpoint.text(props, "EH", ["EJ", "JH"], "J"),
  staticText: () => Midpoint.staticText("J", "EH"),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["FEJ", "JHG"]);
  },
  text: (props: StepTextProps) => EqualRightAngles.text(props, ["FEJ", "JHG"]),
  staticText: () => EqualRightAngles.staticText(["FEJ", "JHG"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Parallelogram,
  dependsOn: [3],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FE", "GH"], 2);
  },
  text: (props: StepTextProps) => EqualSegments.text(props, ["FE", "GH"], 2),
  staticText: () => EqualSegments.staticText(["FE", "GH"]),
});

const step5SASProps: SASProps = {
  seg1s: ["EJ", "JH"],
  seg2s: ["FE", "GH"],
  angles: ["FEJ", "JHG"],
  triangles: ["FEJ", "JHG"],
  tickOverride: Obj.RightTick,
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 3, 4],
  unfocused: (props: StepUnfocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, SVGModes.Unfocused);
  },
  additions: (props: StepFocusProps) => {
    SAS.additions(props, step5SASProps);
  },
  text: (props: StepTextProps) => SAS.text(props, step5SASProps),
  staticText: () => EqualTriangles.staticText(step5SASProps.triangles),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingSegments,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: (props: StepTextProps) => EqualSegments.text(props, ["FJ", "GJ"], 3),
  staticText: () => EqualSegments.staticText(["FJ", "GJ"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.Isosceles,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  },
  text: (props: StepTextProps) => {
    const FJ = props.ctx.getSegment("FJ");
    const GJ = props.ctx.getSegment("GJ");
    const options = { frame: props.frame, num: 3 };
    return (
      <span>
        {linked("FGJ", props.ctx.getTriangle("FGJ"), [
          props.ctx.getTick(FJ, Obj.EqualLengthTick, options),
          props.ctx.getTick(GJ, Obj.EqualLengthTick, options),
        ])}
        {" is isosceles "}
      </span>
    );
  },
  staticText: () => proves.staticText(),
});

export const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };

  const step3 = ctx.addFrame("s3");
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

  const step4 = ctx.addFrame("s4");
  const EH = ctx.push(
    new Segment({ p1: ctx.getPoint("E"), p2: ctx.getPoint("H") })
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

  const step5 = ctx.addFrame("s5");
  SAS.additions(
    { ...defaultStepProps, frame: step5 },
    {
      seg1s: ["EJ", "HJ"],
      seg2s: ["FE", "GH"],
      angles: ["FEJ", "JHG"],
      triangles: ["FEJ", "JHG"],
      tickOverride: Obj.RightTick,
    },
    SVGModes.Blue
  );

  const step6 = ctx.addFrame("s6");
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

  const step7 = ctx.addFrame("s7");
  ctx.getSegment("FG").mode(step7, SVGModes.Purple);
  EqualSegments.additions(
    { ...defaultStepProps, frame: step7 },
    ["FJ", "GJ"],
    1
  );
  return ctx;
};

export const P3: LayoutProps = {
  questions: completeProof3,
  baseContent,
  miniContent: miniContent(),
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7],
};
