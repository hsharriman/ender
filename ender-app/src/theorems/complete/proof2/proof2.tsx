import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { congruent, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, Reason, SVGModes, Vector } from "../../../core/types";
import { Reasons } from "../../reasons";
import { BaseStep, StepCls, linked } from "../../utils";

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

export class Givens implements BaseStep {
  text = (ctx: Content, frame?: string) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");

    return (
      <span>
        {linked("ADB", ADB)}
        {" is a right angle, "}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD)}
      </span>
    );
  };

  ticklessText = (ctx: Content) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");

    return (
      <span>
        {linked("ADB", ADB)}
        {" is a right angle, "}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [DBC])}
      </span>
    );
  };

  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    ctx.getTriangle("ABD").mode(frame, mode);
    ctx.getTriangle("CBD").mode(frame, mode);
  };
  diagram = (ctx: Content, frame: string) => {
    this.additions(ctx, frame, SVGModes.Default);
  };
}

export class Proves implements BaseStep {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const AD = ctx.getSegment("AD").mode(frame, mode);
    const DC = ctx.getSegment("CD").mode(frame, mode);
    const options = inPlace ? {} : { frame };
    ctx.pushTick(AD, Obj.EqualLengthTick, options).mode(frame, mode);
    ctx.pushTick(DC, Obj.EqualLengthTick, options).mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const AD = ctx.getSegment("AD");
    const BD = ctx.getSegment("CD");
    const D = ctx.getPoint("D");
    return (
      <span>
        {linked("D", D)}
        {" is the midpoint of "}
        {linked("AC", AD, [
          BD,
          ctx.getTick(AD, Obj.EqualLengthTick, { frame }),
          ctx.getTick(BD, Obj.EqualLengthTick, { frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };

  ticklessText = (ctx: Content) => {
    const AD = ctx.getSegment("AD");
    const BD = ctx.getSegment("CD");
    const D = ctx.getPoint("D");
    return (
      <span>
        {linked("D", D)}
        {" is the midpoint of "}
        {linked("AC", AD, [BD])}
      </span>
    );
  };
}

export class S1 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");
    const options = inPlace ? {} : { frame };
    ctx.pushTick(ABD, Obj.EqualAngleTick, options).mode(frame, mode);
    ctx.pushTick(DBC, Obj.EqualAngleTick, options).mode(frame, mode);
    ctx.pushTick(ADB, Obj.RightTick, options).mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");

    return (
      <span>
        {linked("ADB", ADB, [ctx.getTick(ADB, Obj.RightTick, { frame })])}
        {"= 90°, "}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [
          ctx.getTick(ABD, Obj.EqualAngleTick, { frame }),
          ctx.getTick(DBC, Obj.EqualAngleTick, { frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class S2 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused, inPlace);
    new S1().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const ADB = ctx.getAngle("ADB");
    const BDC = ctx.getAngle("BDC");
    const options = inPlace ? {} : { frame };
    ctx.pushTick(ADB, Obj.RightTick, options).mode(frame, mode);
    ctx.pushTick(BDC, Obj.RightTick, options).mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const ADB = ctx.getAngle("ADB");
    const BDC = ctx.getAngle("BDC");
    return (
      <span>
        {linked("ADB", ADB, [ctx.getTick(ADB, Obj.RightTick, { frame })])}
        {congruent}
        {linked("BDC", BDC, [ctx.getTick(BDC, Obj.RightTick, { frame })])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class S3 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused, inPlace);
    new S1().additions(ctx, frame, SVGModes.Unfocused, inPlace);
    new S2().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const options = inPlace ? {} : { frame };
    const BD = ctx.getSegment("BD").mode(frame, mode);
    ctx.pushTick(BD, Obj.EqualLengthTick, options).mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const BD = ctx.getSegment("BD");
    const BDLinked = linked("BD", BD, [
      ctx.getTick(BD, Obj.EqualLengthTick, { frame }),
    ]);
    return (
      <span>
        {BDLinked}
        {congruent}
        {BDLinked}
      </span>
    );
  };

  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class S4 implements StepCls {
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    new S1().additions(ctx, frame, mode, inPlace);
    new S2().additions(ctx, frame, mode, inPlace);
    new S3().additions(ctx, frame, mode, inPlace);
    ctx.getTriangle("ABD").mode(frame, mode);
    ctx.getTriangle("CBD").mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const ABD = ctx.getTriangle("ABD");
    const CBD = ctx.getTriangle("CBD");
    const BD = ctx.getSegment("BD");
    const aCBD = ctx.getAngle("CBD");
    const aABD = ctx.getAngle("ABD");
    const aDBA = ctx.getAngle("ADB");
    const aDBC = ctx.getAngle("BDC");
    return (
      <span>
        {linked("ABD", ABD, [
          ctx.getTick(BD, Obj.EqualLengthTick, { frame }),
          ctx.getTick(aABD, Obj.EqualAngleTick, { frame }),
          ctx.getTick(aDBA, Obj.RightTick, { frame }),
        ])}
        {congruent}
        {linked("DBC", CBD, [
          ctx.getTick(BD, Obj.EqualLengthTick, { frame }),
          ctx.getTick(aCBD, Obj.EqualAngleTick, { frame }),
          ctx.getTick(aDBC, Obj.RightTick, { frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class S5 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new S4().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const AD = ctx.getSegment("AD").mode(frame, mode);
    const DC = ctx.getSegment("DC").mode(frame, mode);
    const options = inPlace ? { num: 2 } : { num: 2, frame };
    ctx.pushTick(AD, Obj.EqualLengthTick, options).mode(frame, mode);
    ctx.pushTick(DC, Obj.EqualLengthTick, options).mode(frame, mode);
  };
  text = (ctx: Content, frame?: string) => {
    const AD = ctx.getSegment("AD");
    const DC = ctx.getSegment("DC");
    return (
      <span>
        {linked("AD", AD, [
          ctx.getTick(AD, Obj.EqualLengthTick, { frame, num: 2 }),
        ])}
        {congruent}
        {linked("DC", DC, [
          ctx.getTick(DC, Obj.EqualLengthTick, { frame, num: 2 }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class S6 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new S4().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    new S5().additions(ctx, frame, mode, inPlace);
  };
  text = (ctx: Content, frame?: string) => {
    const D = ctx.getPoint("D");
    const AD = ctx.getSegment("AD");
    const DC = ctx.getSegment("DC");
    // TODO D is not highlighting in long-form
    return (
      <span>
        {linked("D", D)}
        {" is the midpoint of "}
        {linked("AC", AD, [
          DC,
          ctx.getTick(AD, Obj.EqualLengthTick, { frame, num: 2 }),
          ctx.getTick(DC, Obj.EqualLengthTick, { frame, num: 2 }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export const miniContent = () => {
  let ctx = baseContent(false);

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

export const reliesOn = () => {
  let relies = new Map<string, Set<string>>();
  relies.set("s4", new Set(["s1", "s2", "s3"]));
  relies.set("s5", new Set(["s4"]));
  relies.set("s6", new Set(["s5"]));
  return relies;
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

export const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("s2", Reasons.PerpendicularLines);
  reasonMap.set("s3", Reasons.Reflexive);
  reasonMap.set("s4", Reasons.ASA);
  reasonMap.set("s5", Reasons.CorrespondingSegments);
  reasonMap.set("s6", Reasons.Midpoint);
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};

export const P2 = {
  baseContent,
  reasons,
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
