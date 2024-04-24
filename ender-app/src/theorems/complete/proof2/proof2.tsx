import { LinkedText } from "../../../components/LinkedText";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { congruent, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, Reason, SVGModes, Vector } from "../../../core/types";

export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[]
) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;

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

export abstract class BaseStep {
  abstract text(ctx: Content, frame?: string): JSX.Element;
  static additions(
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace: boolean = true
  ): Content {
    return ctx;
  }
  abstract unfocused(ctx: Content, frame: string, inPlace: boolean): Content;
  abstract diagram(ctx: Content, frame: string, inPlace: boolean): Content;
}

export class Givens implements BaseStep {
  unfocused(ctx: Content): Content {
    return ctx;
  }
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

  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const ABD = ctx.getTriangle("ABD").mode(frame, mode);
    const DBC = ctx.getTriangle("CBD").mode(frame, mode);
    return ctx;
  };
  diagram = (ctx: Content, frame: string) => {
    return Givens.additions(ctx, frame, SVGModes.Default);
  };
}

export class Proves implements BaseStep {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    Givens.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  };
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const AD = ctx.getSegment("AD").mode(frame, mode);
    const DC = ctx.getSegment("CD").mode(frame, mode);
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(AD, Obj.EqualLengthTick, options).mode(frame, mode);
    ctx.pushTick(DC, Obj.EqualLengthTick, options).mode(frame, mode);
    return ctx;
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
          ctx.getTick(AD, Obj.EqualLengthTick, { parentFrame: frame }),
          ctx.getTick(BD, Obj.EqualLengthTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    Proves.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
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

export class Step1 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(ABD, Obj.EqualAngleTick, options).mode(frame, mode);
    ctx.pushTick(DBC, Obj.EqualAngleTick, options).mode(frame, mode);
    ctx.pushTick(ADB, Obj.RightTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const BD = ctx.getSegment("BD");
    const ABD = ctx.getAngle("ABD");
    const DBC = ctx.getAngle("CBD");
    const ADB = ctx.getAngle("ADB");

    return (
      <span>
        {linked("ADB", ADB, [
          ctx.getTick(ADB, Obj.RightTick, { parentFrame: frame }),
        ])}
        {"= 90°, "}
        {linked("BD", BD)}
        {" bisects "}
        {linked("ABC", ABD, [
          ctx.getTick(ABD, Obj.EqualAngleTick, { parentFrame: frame }),
          ctx.getTick(DBC, Obj.EqualAngleTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    return Step1.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class Step2 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step1.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const ADB = ctx.getAngle("ADB");
    const BDC = ctx.getAngle("BDC");
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(ADB, Obj.RightTick, options).mode(frame, mode);
    ctx.pushTick(BDC, Obj.RightTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const ADB = ctx.getAngle("ADB");
    const BDC = ctx.getAngle("BDC");
    return (
      <span>
        {linked("ADB", ADB, [
          ctx.getTick(ADB, Obj.RightTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("BDC", BDC, [
          ctx.getTick(BDC, Obj.RightTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame);
    return Step2.additions(ctx, frame, SVGModes.Focused, inPlace);
  }
}

export class Step3 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step1.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step2.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const options = inPlace ? {} : { parentFrame: frame };
    const BD = ctx.getSegment("BD").mode(frame, mode);
    ctx.pushTick(BD, Obj.EqualLengthTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const BD = ctx.getSegment("BD");
    const BDLinked = linked("BD", BD, [
      ctx.getTick(BD, Obj.EqualLengthTick, { parentFrame: frame }),
    ]);
    return (
      <span>
        {BDLinked}
        {congruent}
        {BDLinked}
      </span>
    );
  };

  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame, inPlace);
    return Step3.additions(ctx, frame, SVGModes.Focused, inPlace);
  }
}

export class Step4 implements BaseStep {
  unfocused(ctx: Content): Content {
    // Step3.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    Step1.additions(ctx, frame, mode, inPlace);
    Step2.additions(ctx, frame, mode, inPlace);
    Step3.additions(ctx, frame, mode, inPlace);
    ctx.getTriangle("ABD").mode(frame, mode);
    ctx.getTriangle("CBD").mode(frame, mode);
    return ctx;
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
          ctx.getTick(BD, Obj.EqualLengthTick, { parentFrame: frame }),
          ctx.getTick(aABD, Obj.EqualAngleTick, { parentFrame: frame }),
          ctx.getTick(aDBA, Obj.RightTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("DBC", CBD, [
          ctx.getTick(BD, Obj.EqualLengthTick, { parentFrame: frame }),
          ctx.getTick(aCBD, Obj.EqualAngleTick, { parentFrame: frame }),
          ctx.getTick(aDBC, Obj.RightTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    // this.unfocused(ctx);
    Step4.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };
}

export class Step5 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    // Step3.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const AD = ctx.getSegment("AD").mode(frame, mode);
    const DC = ctx.getSegment("DC").mode(frame, mode);
    const options = inPlace ? { num: 2 } : { num: 2, parentFrame: frame };
    ctx.pushTick(AD, Obj.EqualLengthTick, options).mode(frame, mode);
    ctx.pushTick(DC, Obj.EqualLengthTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const AD = ctx.getSegment("AD");
    const DC = ctx.getSegment("DC");
    return (
      <span>
        {linked("AD", AD, [
          ctx.getTick(AD, Obj.EqualLengthTick, { parentFrame: frame, num: 2 }),
        ])}
        {congruent}
        {linked("DC", DC, [
          ctx.getTick(DC, Obj.EqualLengthTick, { parentFrame: frame, num: 2 }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    return Step5.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class Step6 implements BaseStep {
  unfocused = (ctx: Content, frame: string, inPlace = true): Content => {
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  };
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    Step5.additions(ctx, frame, mode, inPlace);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const D = ctx.getPoint("D");
    const AD = ctx.getSegment("AD");
    const DC = ctx.getSegment("DC");
    return (
      <span>
        {linked("D", D)}
        {" is the midpoint of "}
        {linked("AC", AD, [
          DC,
          ctx.getTick(AD, Obj.EqualLengthTick, { parentFrame: frame, num: 2 }),
          ctx.getTick(DC, Obj.EqualLengthTick, { parentFrame: frame, num: 2 }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    return Step6.additions(ctx, frame, SVGModes.Focused, inPlace);
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
  reasonMap.set("s2", {
    title: "Def. Perpendicular Lines",
    body: "If two lines meet at 90°, then they are perpendicular.",
  });
  reasonMap.set("s3", {
    title: "Reflexive Property",
    body: "Any geometric figure is congruent with itself.",
  });
  reasonMap.set("s4", {
    title: "ASA Triangle Congruence",
    body: "Angle-Side-Angle (ASA) Triangle Congruence. If two triangles have 2 congruent angles and 1 included congruent side, then the triangles are congruent.",
  });
  reasonMap.set("s5", {
    title: "Corresponding Segments Postulate",
    body: "If two triangles are congruent, then the corresponding segments of each triangle are also congruent.",
  });
  reasonMap.set("s6", {
    title: "Def. Midpoint",
    body: "The point that is halfway between two endpoints of a segment.",
  });
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};
