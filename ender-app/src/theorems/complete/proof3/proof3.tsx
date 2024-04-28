import { Angle } from "../../../core/geometry/Angle";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, strs, triangleStr } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../../core/types";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualRightAngles } from "../../templates/EqualRightAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { EqualTriangles } from "../../templates/EqualTriangles";
import { Midpoint } from "../../templates/Midpoint";
import { RightAngle } from "../../templates/RightAngle";
import { SAS, SASProps } from "../../templates/SAS";
import {
  BaseStep,
  StepCls,
  StepFocusProps,
  StepTextProps,
  StepUnfocusProps,
  linked,
} from "../../utils";

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

export class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    const EF = props.ctx.getSegment("EF");
    const FG = props.ctx.getSegment("FG");
    const GH = props.ctx.getSegment("GH");
    const EJ = props.ctx.getSegment("EJ");
    const HJ = props.ctx.getSegment("HJ");
    // console.log(EFGH);

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
  };

  override ticklessText = (ctx: Content) => {
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
  };

  override additions = (props: StepFocusProps) => {
    // props.ctx.getQuadrilateral("EFGH").mode(props.frame, props.mode);
    props.ctx.getTriangle("EFJ").mode(props.frame, props.mode);
    props.ctx.getTriangle("JGH").mode(props.frame, props.mode);
    props.ctx.getTriangle("FGJ").mode(props.frame, props.mode);
    props.ctx.getSegment("FJ").mode(props.frame, props.mode);
    props.ctx.getSegment("GJ").mode(props.frame, props.mode);
  };

  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
  override staticText = () => {
    return (
      <span>
        {"EFGH is a rectangle"}
        {comma}
        {Midpoint.staticText("J", "EH")}
      </span>
    );
  };
}

export class Proves extends BaseStep {
  override unfocused = (props: StepUnfocusProps) => {
    props.ctx.getSegment("EF").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("GH").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("EJ").mode(props.frame, SVGModes.Unfocused);
    props.ctx.getSegment("HJ").mode(props.frame, SVGModes.Unfocused);
  };
  override additions = (props: StepFocusProps) => {
    // TODO why is this unfocused?
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    props.ctx.getSegment("GJ").mode(props.frame, props.mode);
    props.ctx.getSegment("FJ").mode(props.frame, props.mode);
  };
  override text = (props: StepTextProps) => {
    return (
      <span>
        {linked("FGJ", props.ctx.getTriangle("FGJ"))}
        {" is isosceles"}
      </span>
    );
  };
  override ticklessText = (ctx: Content) => {
    return (
      <span>
        {linked("FGJ", ctx.getTriangle("FGJ"))}
        {" is isosceles"}
      </span>
    );
  };
  override staticText = () => {
    return (
      <span>
        {triangleStr("FGJ")}
        {" is isosceles"}
      </span>
    );
  };
}

export class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    props.ctx.getSegment("EF").mode(props.frame, props.mode);
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    props.ctx.getSegment("GH").mode(props.frame, props.mode);
    props.ctx.getSegment("EJ").mode(props.frame, props.mode);
    props.ctx.getSegment("JH").mode(props.frame, props.mode);
  };
  override text = (props: StepTextProps) => {
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
  };
  override ticklessText = (ctx: Content) => new Givens().ticklessText(ctx);
  override staticText = () => new Givens().staticText();
}

export class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s1 = new S1();
    s1.unfocused(props);
    s1.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    Midpoint.additions(props, "J", ["EJ", "JH"]);
  };
  override text = (props: StepTextProps) =>
    Midpoint.text(props, "EH", ["EJ", "JH"], "J");
  override staticText = () => Midpoint.staticText("J", "EH");
}

export class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s2 = new S2();
    s2.additions({ ...props, mode: SVGModes.Unfocused });
    s2.unfocused(props);
  };
  override additions = (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["FEJ", "JHG"]);
  };
  text = (props: StepTextProps) => {
    const JHG = props.ctx.getAngle("JHG");
    return (
      <span>
        {RightAngle.text(props, "FEJ")}
        {" = "}
        {linked("JHG", JHG, [
          props.ctx.getTick(JHG, Obj.RightTick, { frame: props.frame }),
        ])}
      </span>
    );
  };
  staticText = () => {
    return (
      <span>
        {angleStr("FEJ")}
        {" = "}
        {angleStr("JHG")}
      </span>
    );
  };
}

export class S4 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s3 = new S3();
    s3.unfocused(props);
    s3.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FE", "GH"], 2);
  };
  override text = (props: StepTextProps) =>
    EqualSegments.text(props, ["FE", "GH"], 2);
  override staticText = () => EqualSegments.staticText(["FE", "GH"]);
}

export class S5 extends StepCls {
  private sasProps: SASProps = {
    seg1s: ["EJ", "JH"],
    seg2s: ["FE", "GH"],
    angles: ["FEJ", "JHG"],
    triangles: ["FEJ", "JHG"],
    tickOverride: Obj.RightTick,
  };
  override unfocused = (props: StepUnfocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, SVGModes.Unfocused);
  };
  override additions = (props: StepFocusProps) => {
    SAS.additions(props, this.sasProps);
  };
  override text = (props: StepTextProps) => {
    return SAS.text(props, this.sasProps);
  };
  override staticText = () =>
    EqualTriangles.staticText(this.sasProps.triangles);
}

export class S6 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s5 = new S5();
    s5.additions({ ...props, mode: SVGModes.Unfocused });
    s5.unfocused(props);
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  };
  override text = (props: StepTextProps) =>
    EqualSegments.text(props, ["FJ", "GJ"], 3);
  override staticText = () => EqualSegments.staticText(["FJ", "GJ"]);
}

export class S7 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s6 = new S6();
    s6.additions({ ...props, mode: SVGModes.Unfocused });
    s6.unfocused(props);
  };
  override additions = (props: StepFocusProps) => {
    props.ctx.getSegment("FG").mode(props.frame, props.mode);
    EqualSegments.additions(props, ["FJ", "GJ"], 3);
  };
  override text = (props: StepTextProps) => {
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
  };
  override staticText = () => new Proves().staticText();
}

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

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const s1 = `(1) EFGH is a rectangle`;
  const s2 = `(2) EH ${strs.congruent} JH`;
  const s3 = `(3) BD ${strs.congruent} BD`;
  const s4 = `(4) ${strs.angle}FEJ ${strs.congruent} ${strs.angle}JHG`;
  const s5 = `(5) ${strs.triangle}FEJ ${strs.congruent} ${strs.triangle}JHG`;
  const s6 = `(6) FJ ${strs.congruent} GJ`;
  relies.set("s3", [s1]);
  relies.set("s4", [s3]);
  relies.set("s5", [s2, s3, s4]);
  relies.set("s6", [s5]);
  relies.set("s7", [s6]);
  return relies;
};

export const P3 = {
  baseContent,
  reliesOnText: reliesOnText(),
  miniContent: miniContent(),
  Givens,
  Proves,
  S1,
  S2,
  S3,
  S4,
  S5,
  S6,
  S7,
};
