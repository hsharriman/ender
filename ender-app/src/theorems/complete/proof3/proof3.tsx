import { Point } from "../../../core/geometry/Point";
import { Rectangle } from "../../../core/geometry/Rectangle";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../../core/types";
import { ASA, ASAProps } from "../../templates/ASA";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualRightAngles } from "../../templates/EqualRightAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { Midpoint } from "../../templates/Midpoint";
import { Reflexive } from "../../templates/Reflexive";
import { RightAngle } from "../../templates/RightAngle";
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
      [5, 0],
      [5, 3],
      [3, 0],
    ],
  ];
  let ctx = new Content();
  const labels = ["E", "F", "H", "G", "J"];
  const offsets: Vector[] = [
    [-15, -15],
    [0, 5],
    [0, -17],
    [-5, -18],
  ];
  const pts = coords[0];
  const [E, F, G, H, J] = pts.map((c, i) =>
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
  ctx.push(new Rectangle({ pts: [E, F, G, H], parentFrame }, ctx));

  ctx.push(new Triangle({ pts: [E, F, J], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [J, G, H], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [F, G, J], parentFrame }, ctx));
  return ctx;
};

export class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    const BD = props.ctx.getSegment("BD");
    const ABD = props.ctx.getAngle("ABD");

    return (
      <span>
        {RightAngle.text(props, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD)}
      </span>
    );
  };

  override ticklessText = (ctx: Content) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");

    return (
      <span>
        {RightAngle.ticklessText(ctx, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [DBC])}
      </span>
    );
  };

  override additions = (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
  };

  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
}

export class Proves extends BaseStep {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    Midpoint.additions(props, "D", ["AD", "CD"]);
  };
  override text = (props: StepTextProps) => {
    return Midpoint.text(props, "AC", ["AD", "CD"], "D");
  };
  override ticklessText = (ctx: Content) => {
    return Midpoint.ticklessText(ctx, "AC", ["AD", "CD"], "D");
  };
}

export class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CBD"]);
    RightAngle.additions(props, "ADB");
  };
  override text = (props: StepTextProps) => {
    const BD = props.ctx.getSegment("BD");
    const ABD = props.ctx.getAngle("ABD");
    const DBC = props.ctx.getAngle("CBD");

    return (
      <span>
        {RightAngle.text(props, "ADB")}
        {comma}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [
          props.ctx.getTick(ABD, Obj.EqualAngleTick, { frame: props.frame }),
          props.ctx.getTick(DBC, Obj.EqualAngleTick, { frame: props.frame }),
        ])}
      </span>
    );
  };
}

export class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(stepProps);
    new S1().additions(stepProps);
  };
  override additions = (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["ADB", "BDC"]);
  };
  text = (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["ADB", "BDC"]);
  };
}

export class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(stepProps);
    new S1().additions(stepProps);
    new S2().additions(stepProps);
  };
  override additions = (props: StepFocusProps) => {
    Reflexive.additions(props, "BD");
  };
  override text = (props: StepTextProps) => {
    return Reflexive.text(props, "BD");
  };
}

export class S4 extends StepCls {
  private meta: ASAProps = {
    a1s: { angles: ["ADB", "BDC"], tick: Obj.RightTick },
    a2s: { angles: ["ABD", "CBD"], tick: Obj.EqualAngleTick },
    segs: ["BD", "BD"],
    triangles: ["ABD", "CBD"],
  };
  override additions = (props: StepFocusProps) => {
    ASA.additions(props, this.meta);
  };
  override text = (props: StepTextProps) => {
    return ASA.text(props, this.meta);
  };
}

export class S5 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S4().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "DC"], 2);
  };
  override text = (props: StepTextProps) => {
    return EqualSegments.text(props, ["AD", "DC"], 2);
  };
}

export class S6 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S4().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    new S5().additions(props);
  };
  text = (props: StepTextProps) => {
    return Midpoint.text(props, "AC", ["AD", "DC"], "D", 2);
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

  // STEP 2 - PERPENDICULAR LINES
  const step2 = ctx.addFrame("s2");
  const BD = ctx.getSegment("BD").mode(step2, SVGModes.Focused);
  const AD = ctx.getSegment("AD").mode(step2, SVGModes.Focused);
  const CD = ctx.getSegment("CD").mode(step2, SVGModes.Focused);
  const ADB = ctx.getAngle("ADB");
  ctx.pushTick(ADB, Obj.RightTick).mode(step2, SVGModes.Purple);

  // STEP 3 - REFLEXIVE PROPERTY
  const step3 = ctx.addFrame("s3");
  ctx.getSegment("BD").mode(step3, SVGModes.Purple);
  ctx.pushTick(BD, Obj.EqualLengthTick).mode(step3, SVGModes.Purple);

  // STEP 4 - ASA CONGRUENCE
  const step4 = ctx.addFrame("s4");
  const ABD = ctx.getTriangle("ABD").mode(step4, SVGModes.Purple);
  BD.mode(step4, SVGModes.Purple);
  // ADB.mode(step4, SVGModes.Purple);
  const aABD = ctx.getAngle("ABD").mode(step4, SVGModes.Purple);
  ctx.pushTick(ADB, Obj.RightTick).mode(step4, SVGModes.Purple);
  ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step4, SVGModes.Purple);

  const CBD = ctx.getTriangle("CBD").mode(step4, SVGModes.Blue);
  const DBC = ctx.getAngle("CBD");
  ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step4, SVGModes.Blue);
  const aBDC = ctx.getAngle("BDC");
  ctx.pushTick(aBDC, Obj.RightTick).mode(step4, SVGModes.Blue);
  ctx.pushTick(BD, Obj.EqualLengthTick).mode(step4, SVGModes.Blue);

  // STEP 5 - CORRESPONDING SEGMENTS
  const step5 = ctx.addFrame("s5");
  ABD.mode(step5, SVGModes.Focused);
  CBD.mode(step5, SVGModes.Focused);
  BD.mode(step5, SVGModes.Focused);
  ctx.pushTick(BD, Obj.EqualLengthTick).mode(step5, SVGModes.Focused);
  ctx.pushTick(ADB, Obj.RightTick).mode(step5, SVGModes.Focused);
  ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step5, SVGModes.Focused);
  ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step5, SVGModes.Focused);
  ctx.pushTick(aBDC, Obj.RightTick).mode(step5, SVGModes.Focused);
  AD.mode(step5, SVGModes.Purple);
  CD.mode(step5, SVGModes.Blue);
  ctx
    .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
    .mode(step5, SVGModes.Purple);
  ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step5, SVGModes.Blue);
  const AB = ctx.getSegment("AB").mode(step5, SVGModes.Focused);
  const CB = ctx.getSegment("CB").mode(step5, SVGModes.Focused);
  ctx
    .pushTick(AB, Obj.EqualLengthTick, { num: 3 })
    .mode(step5, SVGModes.Focused);
  ctx
    .pushTick(CB, Obj.EqualLengthTick, { num: 3 })
    .mode(step5, SVGModes.Focused);

  // STEP 6 - MIDPOINT
  const step6 = ctx.addFrame("s6");
  AD.mode(step6, SVGModes.Purple);
  CD.mode(step6, SVGModes.Blue);
  ctx
    .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
    .mode(step6, SVGModes.Purple);
  ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step6, SVGModes.Blue);

  return ctx;
};

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const s1 = `(1) ${strs.angle}ABD ${strs.congruent} ${strs.angle}CBD`;
  const s2 = `(2) ${strs.angle}ADB ${strs.congruent} ${strs.angle}BDC`;
  const s3 = `(3) BD ${strs.congruent} BD`;
  const s4 = `(4) ${strs.triangle}ABD ${strs.congruent} ${strs.triangle}CBD`;
  const s5 = `(5) AD ${strs.congruent} DC`;
  relies.set("s4", [s1, s2, s3]);
  relies.set("s5", [s4]);
  relies.set("s6", [s5]);
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
};
