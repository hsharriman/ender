import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, strs } from "../../../core/geometryText";
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
  const coords: Vector[][] = [
    [
      [1, 4],
      [5, 4],
      [3, 0],
      [3, 4],
    ],
  ];
  let ctx = new Content();
  const labels = ["J", "L", "K", "M"];
  const offsets: Vector[] = [
    [-15, -15],
    [8, -15],
    [-5, -17],
    [-5, 6],
  ];
  const pts = coords[0];
  const [J, L, K, M] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [J, M, K], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [L, M, K], parentFrame }, ctx));
  return ctx;
};

export class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    return (
      <span>
        {RightAngle.text(props, "JMK")}
        {comma}
        {EqualSegments.text(props, ["JK", "LK"])}
      </span>
    );
  };

  override ticklessText = (ctx: Content) => {
    return (
      <span>
        {RightAngle.ticklessText(ctx, "JMK")}
        {comma}
        {EqualSegments.ticklessText(ctx, ["JK", "LK"])}
      </span>
    );
  };

  override additions = (props: StepFocusProps) => {
    props.ctx.getTriangle("JMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
  };
  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
}

export class Proves extends BaseStep {
  override additions = (props: StepFocusProps) => {
    new Givens().additions(props);
  };
  override text = (props: StepTextProps) => {
    return EqualTriangles.text(props, ["JMK", "LMK"]);
  };
  override ticklessText = (ctx: Content) => {
    return EqualTriangles.ticklessText(ctx, ["JMK", "LMK"]);
  };
}

export class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    RightAngle.additions(props, "JMK");
  };
  override text = (props: StepTextProps) => {
    return RightAngle.text(props, "JMK");
  };
}

export class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const focusProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(focusProps);
    new S1().additions(focusProps);
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["JK", "LK"]);
  };
  override text = (props: StepTextProps) => {
    return EqualSegments.text(props, ["JK", "LK"]);
  };
}

export class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const S2Cls = new S2();
    S2Cls.unfocused(props);
    S2Cls.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["JMK", "LMK"]);
  };
  override text = (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["JMK", "LMK"]);
  };
}

export class S4 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const S3Cls = new S3();
    S3Cls.unfocused(props);
    S3Cls.additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  };
  override text = (props: StepTextProps) => {
    return Reflexive.text(props, "MK", 2);
  };
}

export class S5 extends StepCls {
  private labels: SASProps = {
    seg1s: ["JK", "LK"],
    seg2s: ["MK", "MK"],
    angles: ["JMK", "LMK"],
    triangles: ["JMK", "LMK"],
    tickOverride: Obj.RightTick,
  };
  override additions = (props: StepFocusProps) => {
    SAS.additions(props, this.labels);
  };
  override text = (props: StepTextProps) => {
    return SAS.text(props, this.labels);
  };
}

export const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };
  // STEP 3 - PERPENDICULAR LINES
  const step3 = ctx.addFrame("s3");
  ctx.getSegment("JM").mode(step3, SVGModes.Focused);
  ctx.getSegment("LM").mode(step3, SVGModes.Focused);
  ctx.getSegment("MK").mode(step3, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["JMK", "LMK"],
    SVGModes.Blue
  );

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s4");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "MK", 1);

  // STEP 4 - SAS CONGRUENCE
  const step5 = ctx.addFrame("s5");
  SAS.additions(
    { ...defaultStepProps, frame: step5 },
    {
      seg1s: ["MK", "MK"],
      seg2s: ["JM", "LM"],
      angles: ["JMK", "LMK"],
      triangles: ["JMK", "LMK"],
      tickOverride: Obj.RightTick,
    },
    SVGModes.Blue
  );
  return ctx;
};

export const reliesOnText = () => {
  // TODO check this
  let relies = new Map<string, string[]>();
  const s1 = `(1) ${strs.angle}JMK${strs.right}`;
  const s2 = `(2) JK ${strs.congruent} LK`;
  const s3 = `(3) ${strs.angle}JMK ${strs.congruent} ${strs.angle}LMK`;
  const s4 = `(4) MK ${strs.congruent} MK`;
  relies.set("s3", [s1]);
  relies.set("s5", [s2, s3, s4]);
  return relies;
};

export const PC2 = {
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
};
