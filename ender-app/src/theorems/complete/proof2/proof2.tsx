import { JSX } from "react/jsx-runtime";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, segmentStr, strs } from "../../../core/geometryText";
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
import { EqualTriangles } from "../../templates/EqualTriangles";
import { CongruentTriangles } from "../../templates/CongruentTriangles";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [1, 0],
      [3, 4],
      [5, 0],
      [3, 0],
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D"];
  const offsets: Vector[] = [
    [-15, -15],
    [0, 5],
    [0, -17],
    [-5, -18],
  ];
  const pts = coords[0];
  const [A, B, C, D] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [A, B, D], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [C, B, D], parentFrame }, ctx));
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
  override staticText = () => {
    return (
      <span>
        {RightAngle.staticText("ADB")}
        {comma}
        {segmentStr("BD")}
        {" bisects "}
        {angleStr("ABC")}
      </span>
    );
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
  override staticText = () => Midpoint.staticText("D", "AC");
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
  override staticText = () => new Givens().staticText();
}

export class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(stepProps);
    new S1().additions(stepProps);
  };
  override additions = (props: StepFocusProps) => {
    RightAngle.additions(props, "ADB");
  };
  override text = (props: StepTextProps) => {
    const ADB = props.ctx.getAngle("ADB");
    return (
      <span>
        {linked("ADB", ADB, [
          props.ctx.getTick(ADB, Obj.RightTick, { frame: props.frame }),
        ])}
        {" is perpendicular"}
      </span>
    );
  };
  override staticText = () => {
    return (
      <span>
        {angleStr("ADB")}
        {" is perpendicular"}
      </span>
    );
  };
}

export class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const stepProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(stepProps);
    new S1().additions(stepProps);
  };
  override additions = (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["ADB", "BDC"]);
  };
  override text = (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["ADB", "BDC"]);
  };
  override staticText = () => EqualRightAngles.staticText(["ADB", "BDC"]);
}

export class S4 extends StepCls {
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
  override staticText = () => Reflexive.staticText("BD");
}

export class S5 extends StepCls {
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
  override staticText = () => EqualTriangles.staticText(["ABD", "CBD"]);
}

export class S6 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S5().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "DC"], 2);
  };
  override text = (props: StepTextProps) => {
    return EqualSegments.text(props, ["AD", "DC"], 2);
  };
  override staticText = () => EqualSegments.staticText(["AD", "DC"]);
}

export class S7 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S5().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    new S6().additions(props);
  };
  override text = (props: StepTextProps) => {
    return Midpoint.text(props, "AC", ["AD", "DC"], "D", 2);
  };
  override staticText = () => Midpoint.staticText("D", "AC");
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
  RightAngle.additions({ ...defaultStepProps, frame: step2 }, "ADB");

  const step3 = ctx.addFrame("s3");
  BD.mode(step3, SVGModes.Focused);
  AD.mode(step3, SVGModes.Focused);
  CD.mode(step3, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step3 },
    ["ADB", "BDC"],
    SVGModes.Blue
  );

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s4");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "BD");

  // STEP 4 - ASA CONGRUENCE
  const step5 = ctx.addFrame("s5");
  ASA.additions(
    { ...defaultStepProps, frame: step5 },
    {
      a1s: { angles: ["ADB", "BDC"], tick: Obj.RightTick },
      a2s: { angles: ["ABD", "CBD"], tick: Obj.EqualAngleTick },
      segs: ["BD", "BD"],
      triangles: ["ABD", "CBD"],
    },
    SVGModes.Blue
  );
  const ABD = ctx.getTriangle("ABD");
  // BD.mode(step4, SVGModes.Purple);
  // // ADB.mode(step4, SVGModes.Purple);
  const aABD = ctx.getAngle("ABD");
  // ctx.pushTick(ADB, Obj.RightTick).mode(step4, SVGModes.Purple);
  // ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step4, SVGModes.Purple);

  const CBD = ctx.getTriangle("CBD");
  const DBC = ctx.getAngle("CBD");
  // ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step4, SVGModes.Blue);
  const aBDC = ctx.getAngle("BDC");
  // ctx.pushTick(aBDC, Obj.RightTick).mode(step4, SVGModes.Blue);
  // ctx.pushTick(BD, Obj.EqualLengthTick).mode(step4, SVGModes.Blue);

  // STEP 5 - CORRESPONDING SEGMENTS
  const step6 = ctx.addFrame("s6");
  // ABD.mode(step6, SVGModes.Focused);
  // CBD.mode(step6, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ABD", "CBD"]
  );
  // BD.mode(step6, SVGModes.Focused);
  // ctx.pushTick(BD, Obj.EqualLengthTick).mode(step6, SVGModes.Focused);
  Reflexive.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    "BD"
  );
  // ctx
  //   .pushTick(ctx.getAngle("ADB"), Obj.RightTick)
  //   .mode(step6, SVGModes.Focused);
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ADB", "BDC"]
  );
  // ctx.pushTick(DBC, Obj.EqualAngleTick).mode(step6, SVGModes.Focused);
  // ctx.pushTick(aABD, Obj.EqualAngleTick).mode(step6, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["ABD", "CBD"]
  );
  EqualAngles.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["BAD", "BCD"],
    2
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6 },
    ["AD", "DC"],
    2,
    SVGModes.Blue
  );
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6, mode: SVGModes.Focused },
    ["AB", "CB"],
    3
  );
  // ctx.pushTick(aBDC, Obj.RightTick).mode(step6, SVGModes.Focused);
  // AD.mode(step6, SVGModes.Purple);
  // CD.mode(step6, SVGModes.Blue);
  // ctx
  //   .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
  //   .mode(step6, SVGModes.Purple);
  // ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step6, SVGModes.Blue);
  // const AB = ctx.getSegment("AB").mode(step6, SVGModes.Focused);
  // const CB = ctx.getSegment("CB").mode(step6, SVGModes.Focused);
  // ctx
  //   .pushTick(AB, Obj.EqualLengthTick, { num: 3 })
  //   .mode(step5, SVGModes.Focused);
  // ctx
  //   .pushTick(CB, Obj.EqualLengthTick, { num: 3 })
  //   .mode(step5, SVGModes.Focused);

  // STEP 6 - MIDPOINT
  const step7 = ctx.addFrame("s7");
  AD.mode(step7, SVGModes.Purple);
  CD.mode(step7, SVGModes.Blue);
  ctx
    .pushTick(AD, Obj.EqualLengthTick, { num: 2 })
    .mode(step7, SVGModes.Purple);
  ctx.pushTick(CD, Obj.EqualLengthTick, { num: 2 }).mode(step7, SVGModes.Blue);

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
  relies.set("s7", [s5]);
  return relies;
};

export const P2 = {
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
