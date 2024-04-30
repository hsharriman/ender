import { Angle } from "../../../core/geometry/Angle";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, strs, triangleStr } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../../core/types";
import { EqualRightAngles } from "../../templates/EqualRightAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { EqualTriangles } from "../../templates/EqualTriangles";
import { Reflexive } from "../../templates/Reflexive";
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
  const pts: Vector[] = [
    [1, 0], // L BL
    [1, 3], // M TL
    [6, 0], // K BR
    [6, 3], // N TR
  ];
  let ctx = new Content();
  const labels = ["L", "M", "K", "N"];
  const offsets: Vector[] = [
    [-15, -15],
    [-10, 5],
    [0, -17],
    [8, 0],
  ];
  const [L, M, K, N] = pts.map((c, i) => {
    // TODO option to make point labels invisible
    return ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        parentFrame: parentFrame,
      })
    );
  });
  ctx.push(new Triangle({ pts: [L, M, K], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [K, N, M], parentFrame }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: L, center: M, end: N }));
  ctx.push(new Angle({ start: L, center: K, end: N }));
  return ctx;
};

export class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    const LK = props.ctx.getSegment("LK");
    const LM = props.ctx.getSegment("LM");
    const MN = props.ctx.getSegment("MN");
    const NK = props.ctx.getSegment("NK");

    return (
      <span>
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          LK,
          LM,
          MN,
          NK,
        ])}
        {" is a quadrilateral"}
        {comma}
        {EqualSegments.text(props, ["LM", "NK"])}
        {comma}
        {RightAngle.text(props, "KLM")}
      </span>
    );
  };

  override ticklessText = (ctx: Content) => {
    const LK = ctx.getSegment("LK");
    const LM = ctx.getSegment("LM");
    const MN = ctx.getSegment("MN");
    const NK = ctx.getSegment("NK");

    return (
      <span>
        {linked("EFGH", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          LK,
          LM,
          MN,
          NK,
        ])}
        {" is a quadrilateral"}
        {comma}
        {EqualSegments.ticklessText(ctx, ["LM", "NK"])}
        {comma}
        {RightAngle.ticklessText(ctx, "KLM")}
      </span>
    );
  };

  override additions = (props: StepFocusProps) => {
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("KMN").mode(props.frame, props.mode);
  };

  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
  override staticText = () => {
    return (
      <span>
        {"EFGH is a quadrilateral"}
        {comma}
        {EqualSegments.staticText(["LM", "NK"])}
        {comma}
        {RightAngle.staticText("KLM")}
      </span>
    );
  };
}

export class Proves extends BaseStep {
  override additions = (props: StepFocusProps) => {
    new Givens().additions(props);
  };
  override text = (props: StepTextProps) =>
    EqualTriangles.text(props, ["LMK", "KMN"]);
  override ticklessText = (ctx: Content) =>
    EqualTriangles.ticklessText(ctx, ["LMK", "KMN"]);
  override staticText = () => EqualTriangles.staticText(["LMK", "KMN"]);
}

export class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    ["LK", "LM", "MN", "NK"].map((s) =>
      props.ctx.getSegment(s).mode(props.frame, props.mode)
    );
  };
  override text = (props: StepTextProps) => {
    return (
      <span>
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          props.ctx.getSegment("LK"),
          props.ctx.getSegment("LM"),
          props.ctx.getSegment("MN"),
          props.ctx.getSegment("NK"),
        ])}
        {" is a quadrilateral"}
      </span>
    );
  };
  override ticklessText = (ctx: Content) => {
    return (
      <span>
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          ctx.getSegment("LK"),
          ctx.getSegment("LM"),
          ctx.getSegment("MN"),
          ctx.getSegment("NK"),
        ])}
        {" is a quadrilateral"}
      </span>
    );
  };
  override staticText = () => <span>{"KLMN is a quadrilateral"}</span>;
}

export class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s1 = new S1();
    s1.unfocused(props);
    s1.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["LM", "NK"]);
  };
  override text = (props: StepTextProps) =>
    EqualSegments.text(props, ["LM", "NK"]);
  override staticText = () => EqualSegments.staticText(["LM", "NK"]);
}

export class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s2 = new S2();
    s2.additions({ ...props, mode: SVGModes.Unfocused });
    s2.unfocused(props);
  };
  override additions = (props: StepFocusProps) => {
    RightAngle.additions(props, "KLM");
  };
  override text = (props: StepTextProps) => RightAngle.text(props, "KLM");
  override staticText = () => RightAngle.staticText("KLM");
}

export class S4 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s3 = new S3();
    s3.unfocused(props);
    s3.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["KLM", "MNK"]);
  };
  override text = (props: StepTextProps) => {
    const MNK = props.ctx.getAngle("MNK");
    return (
      <span>
        {RightAngle.text(props, "KLM")}
        {" = "}
        {linked("MNK", MNK, [
          props.ctx.getTick(MNK, Obj.RightTick, { frame: props.frame }),
        ])}
      </span>
    );
  };
  override staticText = () => {
    return (
      <span>
        {angleStr("KLM")}
        {" = "}
        {angleStr("MNK")}
      </span>
    );
  };
}

export class S5 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const s4 = new S4();
    s4.unfocused(props);
    s4.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  };
  override text = (props: StepTextProps) => Reflexive.text(props, "MK", 2);
  override staticText = () => Reflexive.staticText("MK");
}

export class S6 extends StepCls {
  private sasProps: SASProps = {
    seg1s: ["LM", "KN"],
    seg2s: ["MK", "MK"],
    angles: ["KLM", "MNK"],
    triangles: ["KLM", "MNK"],
    tickOverride: Obj.RightTick,
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

export const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };

  const step4 = ctx.addFrame("s4");
  const rectangleSegs = ["LK", "LM", "MN", "NK"];
  rectangleSegs.map((s) => ctx.getSegment(s).mode(step4, SVGModes.Focused));
  const rectangleAngles = ["LMN", "NKL"];
  rectangleAngles.map((a) =>
    RightAngle.additions(
      { ...defaultStepProps, frame: step4, mode: SVGModes.Focused },
      a
    )
  );
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step4 },
    ["KLM", "MNK"],
    SVGModes.Blue
  );

  const step6 = ctx.addFrame("s6");
  SAS.additions(
    { ...defaultStepProps, frame: step6 },
    {
      seg1s: ["LM", "NK"],
      seg2s: ["MK", "MK"],
      angles: ["KLM", "MNK"],
      triangles: ["KLM", "MNK"],
      tickOverride: Obj.RightTick,
    },
    SVGModes.Blue
  );
  return ctx;
};

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const s1 = `(1) KLMN is a quadrilateral`;
  const s2 = `(2) LM ${strs.congruent} MK`;
  const s4 = `(4) MK ${strs.congruent} MK`;
  const s5 = `(5) ${strs.angle}KLM ${strs.right} = ${strs.angle}MNK`;
  relies.set("s4", [s1]);
  relies.set("s6", [s2, s4, s5]);
  return relies;
};

export const PC3 = {
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
};
