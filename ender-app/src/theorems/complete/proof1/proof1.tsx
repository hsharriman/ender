import { LinkedText } from "../../../components/LinkedText";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, congruent, parallel, strs } from "../../../core/geometryText";
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
      [1, 4],
      [7, 0],
      [0, 1],
      [8, 3],
      [4, 2],
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D", "M"];
  const offsets: Vector[] = [
    [5, 5],
    [10, -10],
    [-20, -20],
    [3, 3],
    [0, 10],
  ];
  const pts = coords[0];
  const [A, B, C, D, M] = pts.map((c, i) =>
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

  [
    new Triangle({ pts: [A, C, M], parentFrame }, ctx),
    new Triangle({ pts: [B, D, M], parentFrame }, ctx),
  ].map((t) => ctx.push(t));
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
    const AM = ctx.getSegment("AM");
    const BM = ctx.getSegment("BM");
    const CM = ctx.getSegment("CM");
    const DM = ctx.getSegment("DM");

    return (
      <span>
        {linked("AB", AM, [BM])}
        {" and "}
        {linked("CD", CM, [DM])}
        {" intersect at point "}
        {linked("M", ctx.getPoint("M"))}
        {comma}
        {linked("AM", AM, [
          ctx.getTick(AM, Obj.EqualLengthTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("BM", BM, [
          ctx.getTick(BM, Obj.EqualLengthTick, { parentFrame: frame }),
        ])}
        {comma}
        {linked("CM", CM, [
          ctx.getTick(CM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
        ])}
        {congruent}
        {linked("DM", DM, [
          ctx.getTick(DM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
        ])}
      </span>
    );
  };

  ticklessText = (ctx: Content) => {
    const AM = ctx.getSegment("AM");
    const BM = ctx.getSegment("BM");
    const CM = ctx.getSegment("CM");
    const DM = ctx.getSegment("DM");

    return (
      <span>
        {linked("AB", AM, [BM])}
        {" and "}
        {linked("CD", CM, [DM])}
        {" intersect at point "}
        {linked("M", ctx.getPoint("M"))}
        {comma}
        {linked("AM", AM)}
        {congruent}
        {linked("BM", BM)}
        {comma}
        {linked("CM", CM)}
        {congruent}
        {linked("DM", DM)}
      </span>
    );
  };

  static additions = (ctx: Content, frame: string, mode: SVGModes) => {
    ctx.getTriangle("ACM").mode(frame, mode);
    ctx.getTriangle("BDM").mode(frame, mode);
    return ctx;
  };
  diagram = (ctx: Content, frame: string) => {
    return Givens.additions(ctx, frame, SVGModes.Default);
  };
}

export class Proves implements BaseStep {
  unfocused = (ctx: Content, frame: string) => {
    Givens.additions(ctx, frame, SVGModes.Unfocused);
    return ctx;
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    const AC = ctx.getSegment("AC").mode(frame, mode);
    const BD = ctx.getSegment("BD").mode(frame, mode);
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(AC, Obj.ParallelTick, options).mode(frame, mode);
    ctx.pushTick(BD, Obj.ParallelTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const AC = ctx.getSegment("AC");
    const BD = ctx.getSegment("BD");
    return (
      <span>
        {linked("AC", AC, [
          ctx.getTick(AC, Obj.ParallelTick, { parentFrame: frame }),
        ])}
        {parallel}
        {linked("BD", BD, [
          ctx.getTick(BD, Obj.ParallelTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };

  ticklessText = (ctx: Content) => {
    const AC = ctx.getSegment("AC");
    const BD = ctx.getSegment("BD");
    return (
      <span>
        {linked("AC", AC)}
        {parallel}
        {linked("BD", BD)}
      </span>
    );
  };
}

export class Step1 implements BaseStep {
  unfocused(ctx: Content, frame: string): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    const options = inPlace ? {} : { parentFrame: frame };
    // ticks
    ctx
      .pushTick(
        ctx.getSegment("AM").mode(frame, mode),
        Obj.EqualLengthTick,
        options
      )
      .mode(frame, mode);
    ctx
      .pushTick(
        ctx.getSegment("BM").mode(frame, mode),
        Obj.EqualLengthTick,
        options
      )
      .mode(frame, mode);
    ctx
      .pushTick(ctx.getSegment("CM").mode(frame, mode), Obj.EqualLengthTick, {
        ...options,
        num: 2,
      })
      .mode(frame, mode);
    ctx
      .pushTick(ctx.getSegment("DM").mode(frame, mode), Obj.EqualLengthTick, {
        ...options,
        num: 2,
      })
      .mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const AM = ctx.getSegment("AM");
    const BM = ctx.getSegment("BM");
    const CM = ctx.getSegment("CM");
    const DM = ctx.getSegment("DM");
    return (
      <span>
        {linked("AM", AM, [
          ctx.getTick(AM, Obj.EqualLengthTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("BM", BM, [
          ctx.getTick(BM, Obj.EqualLengthTick, { parentFrame: frame }),
        ])}
        {comma}
        {linked("CM", CM, [
          ctx.getTick(CM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
        ])}
        {congruent}
        {linked("DM", DM, [
          ctx.getTick(DM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    return Step1.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class Step2 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused);
    Step1.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    let CMA = ctx.getAngle("CMA").mode(frame, mode); // TODO mode does nothing
    let DMB = ctx.getAngle("DMB").mode(frame, mode);
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(CMA, Obj.EqualAngleTick, options).mode(frame, mode);
    ctx.pushTick(DMB, Obj.EqualAngleTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const CMA = ctx.getAngle("CMA");
    const DMB = ctx.getAngle("DMB");
    return (
      <span>
        {linked("CMA", CMA, [
          ctx.getTick(CMA, Obj.EqualAngleTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("DMB", DMB, [
          ctx.getTick(DMB, Obj.EqualAngleTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame);
    return Step2.additions(ctx, frame, SVGModes.Default, inPlace);
  }
}

export class Step3 implements BaseStep {
  unfocused(ctx: Content): Content {
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
    ctx.getTriangle("ACM").mode(frame, mode);
    ctx.getTriangle("BDM").mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const ACM = ctx.getTriangle("ACM");
    const BDM = ctx.getTriangle("BDM");
    const AM = ctx.getSegment("AM");
    const CM = ctx.getSegment("CM");
    const BM = ctx.getSegment("BM");
    const DM = ctx.getSegment("DM");
    const CMA = ctx.getAngle("CMA");
    const DMB = ctx.getAngle("DMB");

    return (
      <span>
        {linked("ACM", ACM, [
          ctx.getTick(AM, Obj.EqualLengthTick, { parentFrame: frame }),
          ctx.getTick(CM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
          ctx.getTick(CMA, Obj.EqualAngleTick, { parentFrame: frame }),
        ])}
        {congruent}
        {linked("BDM", BDM, [
          ctx.getTick(BM, Obj.EqualLengthTick, { parentFrame: frame }),
          ctx.getTick(DM, Obj.EqualLengthTick, { num: 2, parentFrame: frame }),
          ctx.getTick(DMB, Obj.EqualAngleTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };

  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx);
    return Step3.additions(ctx, frame, SVGModes.Focused, inPlace);
  }
}

export class Step4 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Step3.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    let CAM = ctx.getAngle("CAM").mode(frame, mode);
    let DBM = ctx.getAngle("DBM").mode(frame, mode);
    const options = inPlace ? {} : { parentFrame: frame };
    ctx
      .pushTick(CAM, Obj.EqualAngleTick, { ...options, num: 2 })
      .mode(frame, mode);
    ctx
      .pushTick(DBM, Obj.EqualAngleTick, { ...options, num: 2 })
      .mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const CAM = ctx.getAngle("CAM");
    const DBM = ctx.getAngle("DBM");
    return (
      <span>
        {linked("CAM", CAM, [
          ctx.getTick(CAM, Obj.EqualAngleTick, {
            num: 2,
            parentFrame: frame,
          }),
        ])}
        {congruent}
        {linked("DBM", DBM, [
          ctx.getTick(DBM, Obj.EqualAngleTick, {
            num: 2,
            parentFrame: frame,
          }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    Step4.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };
}

export class Step5 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Step3.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    let AC = ctx.getSegment("AC").mode(frame, mode);
    let BD = ctx.getSegment("BD").mode(frame, mode);
    const options = inPlace ? {} : { parentFrame: frame };
    ctx.pushTick(AC, Obj.ParallelTick, options).mode(frame, mode);
    ctx.pushTick(BD, Obj.ParallelTick, options).mode(frame, mode);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const AC = ctx.getSegment("AC");
    const BD = ctx.getSegment("BD");
    return (
      <span>
        {linked("AC", AC, [
          ctx.getTick(AC, Obj.ParallelTick, { parentFrame: frame }),
        ])}
        {parallel}
        {linked("BD", BD, [
          ctx.getTick(BD, Obj.ParallelTick, { parentFrame: frame }),
        ])}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    return this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export const miniContent = () => {
  let ctx = baseContent(false);

  // STEP 2 - VERTICAL ANGLES
  const step2 = ctx.addFrame("s2");
  ctx.getTriangle("ACM").mode(step2, SVGModes.Default);
  ctx.getTriangle("BDM").mode(step2, SVGModes.Default);
  let AC = ctx.getSegment("AC").mode(step2, SVGModes.Hidden);
  let BD = ctx.getSegment("BD").mode(step2, SVGModes.Hidden);
  let CMA = ctx.getAngle("CMA");
  // .mode(step2, SVGModes.Purple);
  let DMB = ctx.getAngle("DMB");
  // .mode(step2, SVGModes.Blue);
  ctx.pushTick(CMA, Obj.EqualAngleTick).mode(step2, SVGModes.Purple);
  ctx.pushTick(DMB, Obj.EqualAngleTick).mode(step2, SVGModes.Blue);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step3 = ctx.addFrame("s3");
  const SAS = (frame: string, t1Mode: SVGModes, t2Mode: SVGModes) => {
    // T1
    let AM = ctx.getSegment("AM").mode(frame, t1Mode);
    let CM = ctx.getSegment("CM").mode(frame, t1Mode);
    let AC = ctx.getSegment("AC").mode(frame, t1Mode);
    // let CMA = ctx.getAngle("CMA").mode(frame, t1Mode);
    // t1 ticks
    ctx.pushTick(CMA, Obj.EqualAngleTick).mode(frame, t1Mode);
    ctx.pushTick(AM, Obj.EqualLengthTick).mode(frame, t1Mode);
    ctx.pushTick(CM, Obj.EqualLengthTick, { num: 2 }).mode(frame, t1Mode);

    // T2
    let BM = ctx.getSegment("BM").mode(frame, t2Mode);
    let DM = ctx.getSegment("DM").mode(frame, t2Mode);
    let BD = ctx.getSegment("BD").mode(frame, t2Mode);
    // let DMB = ctx.getAngle("DMB").mode(frame, t2Mode);
    // t2 ticks
    ctx.pushTick(DMB, Obj.EqualAngleTick).mode(frame, t2Mode);
    ctx.pushTick(BM, Obj.EqualLengthTick).mode(frame, t2Mode);
    ctx.pushTick(DM, Obj.EqualLengthTick, { num: 2 }).mode(frame, t2Mode);
  };
  SAS(step3, SVGModes.Purple, SVGModes.Blue);

  // STEP 4 - CORRESPONDING ANGLES
  const step4 = ctx.addFrame("s4");
  SAS(step4, SVGModes.Default, SVGModes.Default);
  AC.mode(step4, SVGModes.Default);
  BD.mode(step4, SVGModes.Default);
  // step 4 ticks
  ctx
    .pushTick(ctx.getAngle("MAC"), Obj.EqualAngleTick, { num: 2 })
    .mode(step4, SVGModes.Purple);
  ctx
    .pushTick(ctx.getAngle("MBD"), Obj.EqualAngleTick, { num: 2 })
    .mode(step4, SVGModes.Blue);
  ctx
    .pushTick(ctx.getAngle("BDM"), Obj.EqualAngleTick, { num: 3 })
    .mode(step4, SVGModes.Default);
  ctx
    .pushTick(ctx.getAngle("ACM"), Obj.EqualAngleTick, { num: 3 })
    .mode(step4, SVGModes.Default);
  ctx
    .pushTick(AC, Obj.EqualLengthTick, { num: 3 })
    .mode(step4, SVGModes.Default);
  ctx
    .pushTick(BD, Obj.EqualLengthTick, { num: 3 })
    .mode(step4, SVGModes.Default);

  // STEP 5 - ALTERNATE ANGLES
  const step5 = ctx.addFrame("s5");
  ctx.getSegment("AM").mode(step5, SVGModes.Default);
  ctx.getSegment("BM").mode(step5, SVGModes.Default);

  AC.mode(step5, SVGModes.Purple);
  BD.mode(step5, SVGModes.Blue);
  // step 5 ticks
  ctx
    .pushTick(ctx.getAngle("MAC"), Obj.EqualAngleTick)
    .mode(step5, SVGModes.Default);
  ctx
    .pushTick(ctx.getAngle("MBD"), Obj.EqualAngleTick)
    .mode(step5, SVGModes.Default);
  ctx.pushTick(AC, Obj.ParallelTick).mode(step5, SVGModes.Purple);
  ctx.pushTick(BD, Obj.ParallelTick).mode(step5, SVGModes.Blue);

  return ctx;
};

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const s1 = `(1) AM ${strs.congruent} BM`;
  const s2 = `(1) CM ${strs.congruent} DM`;
  const s3 = `(2) ${strs.angle}CMA ${strs.congruent} ${strs.angle}DMB`;
  const s4 = `(3) ${strs.triangle}ACM ${strs.congruent} ${strs.triangle}BDM`;
  const s5 = `(4) ${strs.angle}CAM ${strs.congruent} ${strs.angle}DBM`;
  relies.set("s3", [s1, s2, s3]);
  relies.set("s4", [s4]);
  relies.set("s5", [s5]);
  return relies;
};

export const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("s2", {
    title: "Vertical Angles Theorem",
    body: "If two lines intersect each other, then the angles that are opposite from each other are congruent.",
  });
  reasonMap.set("s3", {
    title: "SAS Triangle Congruence",
    body: "Side-Angle-Side (SAS) Congruence. If two triangles have two sides and the included angle of one triangle congruent to two sides and the included angle of another triangle, then the triangles are congruent.",
  });
  reasonMap.set("s4", {
    title: "Corresponding Angles Postulate",
    body: "If two triangles are congruent, then corresponding angles are the pairs of angles that have the same measurement.",
  });
  reasonMap.set("s5", {
    title: "Alternate Interior Angles Theorem",
    body: "If a transversal (a line that crosses two or more lines) intersects a pair of lines such that the alternate interior angles are congruent, then the lines are parallel to each other.",
  });
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};
