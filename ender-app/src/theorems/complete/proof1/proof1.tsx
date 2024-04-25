import { LinkedText } from "../../../components/LinkedText";
import { BaseGeometryObject } from "../../../core/geometry/BaseGeometryObject";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, congruent, parallel, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, Reason, SVGModes, Vector } from "../../../core/types";
import { Reasons } from "../../reasons";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { ParallelLines } from "../../templates/ParallelLines";
import { SAS } from "../../templates/SAS";
import { VerticalAngles } from "../../templates/VerticalAngles";
import { BaseStep, linked } from "../../utils";

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

  ctx.push(new Segment({ p1: A, p2: B, parentFrame }));
  ctx.push(new Segment({ p1: C, p2: D, parentFrame }));
  return ctx;
};

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
        {" intersect at "}
        {linked("M", ctx.getPoint("M"))}
        {comma}
        {EqualSegments.text(ctx, ["AM", "BM"], { frame })}
        {comma}
        {EqualSegments.text(ctx, ["CM", "DM"], { frame, num: 2 })}
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
        {EqualSegments.ticklessText(ctx, ["AM", "BM"])}
        {comma}
        {EqualSegments.ticklessText(ctx, ["CM", "DM"])}
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
    ParallelLines.additions(ctx, frame, ["AC", "BD"], mode, mode, inPlace);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    return ParallelLines.text(ctx, ["AC", "BD"], { frame });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };

  ticklessText = (ctx: Content) => {
    return ParallelLines.ticklessText(ctx, ["AC", "BD"]);
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
    EqualSegments.additions(ctx, ["AM", "BM"], frame, mode, mode, inPlace);
    EqualSegments.additions(ctx, ["CM", "DM"], frame, mode, mode, inPlace, 2);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    return (
      <span>
        {EqualSegments.text(ctx, ["AM", "BM"], { frame })}
        {comma}
        {EqualSegments.text(ctx, ["CM", "DM"], { frame, num: 2 })}
      </span>
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    return Step1.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export class Step2 implements BaseStep {
  unfocused = (ctx: Content, frame: string) => {
    Givens.additions(ctx, frame, SVGModes.Unfocused);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    const AM = ctx.getSegment("AM");
    const BM = ctx.getSegment("BM");
    const CM = ctx.getSegment("CM");
    const DM = ctx.getSegment("DM");
    // TODO M highlights on wrong diagram in long-form
    return (
      <span>
        {linked("AB", AM, [BM])}
        {" and "}
        {linked("CD", CM, [DM])}
        {" intersect at "}
        {linked("M", ctx.getPoint("M"))}
      </span>
    );
  };
  static additions = (ctx: Content, frame: string, mode: SVGModes) => {
    ctx.getSegment("AM").mode(frame, mode);
    ctx.getSegment("BM").mode(frame, mode);
    ctx.getSegment("CM").mode(frame, mode);
    ctx.getSegment("DM").mode(frame, mode);
    return ctx;
  };
  diagram = (ctx: Content, frame: string) => {
    this.unfocused(ctx, frame);
    return Step2.additions(ctx, frame, SVGModes.Focused);
  };
}

export class Step3 implements BaseStep {
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
    EqualAngles.additions(ctx, ["CMA", "DMB"], frame, mode, mode, inPlace);
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["CMA", "DMB"], { frame });
  };
  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame);
    return Step3.additions(ctx, frame, SVGModes.Focused, inPlace);
  }
}

export class Step4 implements BaseStep {
  unfocused(ctx: Content): Content {
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    SAS.additions(
      ctx,
      {
        seg1s: ["AM", "BM"],
        seg2s: ["CM", "DM"],
        angles: ["CMA", "DMB"],
        triangles: ["ACM", "BDM"],
      },
      frame,
      mode,
      mode,
      inPlace
    );
    return ctx;
  };
  text = (ctx: Content, frame?: string) => {
    return SAS.text(
      ctx,
      {
        seg1s: ["AM", "BM"],
        seg2s: ["CM", "DM"],
        angles: ["CMA", "DMB"],
        triangles: ["ACM", "BDM"],
      },
      frame
    );
  };

  diagram(ctx: Content, frame: string, inPlace = true): Content {
    return Step4.additions(ctx, frame, SVGModes.Focused, inPlace);
  }
}

export class Step5 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    return EqualAngles.additions(
      ctx,
      ["CAM", "DBM"],
      frame,
      mode,
      mode,
      inPlace,
      2
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["CAM", "DBM"], { frame, num: 2 });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    Step5.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };
}

export class Step6 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    Step5.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  static additions = (
    ctx: Content,
    frame: string,
    mode: SVGModes,
    inPlace = true
  ) => {
    return ParallelLines.additions(
      ctx,
      frame,
      ["AC", "BD"],
      mode,
      mode,
      inPlace
    );
  };
  text = (ctx: Content, frame?: string) => {
    return ParallelLines.text(ctx, ["AC", "BD"], { frame });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    return Step6.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export const miniContent = () => {
  let ctx = baseContent(false);

  // STEP 2 - VERTICAL ANGLES
  const step3 = ctx.addFrame("s3");
  ctx.getTriangle("ACM").mode(step3, SVGModes.Default);
  ctx.getTriangle("BDM").mode(step3, SVGModes.Default);
  let AC = ctx.getSegment("AC").mode(step3, SVGModes.Hidden);
  let BD = ctx.getSegment("BD").mode(step3, SVGModes.Hidden);
  let CMA = ctx.getAngle("CMA");
  // .mode(step2, SVGModes.Purple);
  let DMB = ctx.getAngle("DMB");
  // .mode(step2, SVGModes.Blue);
  ctx.pushTick(CMA, Obj.EqualAngleTick).mode(step3, SVGModes.Purple);
  ctx.pushTick(DMB, Obj.EqualAngleTick).mode(step3, SVGModes.Blue);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step4 = ctx.addFrame("s4");
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
  SAS(step4, SVGModes.Purple, SVGModes.Blue);

  // STEP 4 - CORRESPONDING ANGLES
  const step5 = ctx.addFrame("s5");
  SAS(step5, SVGModes.Default, SVGModes.Default);
  AC.mode(step5, SVGModes.Default);
  BD.mode(step5, SVGModes.Default);
  // step 4 ticks
  ctx
    .pushTick(ctx.getAngle("MAC"), Obj.EqualAngleTick, { num: 2 })
    .mode(step5, SVGModes.Purple);
  ctx
    .pushTick(ctx.getAngle("MBD"), Obj.EqualAngleTick, { num: 2 })
    .mode(step5, SVGModes.Blue);
  ctx
    .pushTick(ctx.getAngle("BDM"), Obj.EqualAngleTick, { num: 3 })
    .mode(step5, SVGModes.Default);
  ctx
    .pushTick(ctx.getAngle("ACM"), Obj.EqualAngleTick, { num: 3 })
    .mode(step5, SVGModes.Default);
  ctx
    .pushTick(AC, Obj.EqualLengthTick, { num: 3 })
    .mode(step5, SVGModes.Default);
  ctx
    .pushTick(BD, Obj.EqualLengthTick, { num: 3 })
    .mode(step5, SVGModes.Default);

  // STEP 5 - ALTERNATE ANGLES
  const step6 = ctx.addFrame("s6");
  ctx.getSegment("AM").mode(step6, SVGModes.Default);
  ctx.getSegment("BM").mode(step6, SVGModes.Default);

  AC.mode(step6, SVGModes.Purple);
  BD.mode(step6, SVGModes.Blue);
  // step 5 ticks
  ctx
    .pushTick(ctx.getAngle("MAC"), Obj.EqualAngleTick)
    .mode(step6, SVGModes.Default);
  ctx
    .pushTick(ctx.getAngle("MBD"), Obj.EqualAngleTick)
    .mode(step6, SVGModes.Default);
  ctx.pushTick(AC, Obj.ParallelTick).mode(step6, SVGModes.Purple);
  ctx.pushTick(BD, Obj.ParallelTick).mode(step6, SVGModes.Blue);

  return ctx;
};

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const r1 = `(1) AM ${strs.congruent} BM`;
  const r2 = `(1) CM ${strs.congruent} DM`;
  const r3 = `(2) AB and CD intersect at M`;
  const r4 = `(2) ${strs.angle}CMA ${strs.congruent} ${strs.angle}DMB`;
  const r5 = `(3) ${strs.triangle}ACM ${strs.congruent} ${strs.triangle}BDM`;
  const r6 = `(4) ${strs.angle}CAM ${strs.congruent} ${strs.angle}DBM`;
  relies.set("s3", [r3]);
  relies.set("s4", [r1, r2, r4]);
  relies.set("s5", [r5]);
  relies.set("s6", [r6]);
  return relies;
};

export const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("s3", Reasons.VerticalAngles);
  reasonMap.set("s4", Reasons.SAS);
  reasonMap.set("s5", Reasons.CorrespondingAngles);
  reasonMap.set("s6", Reasons.AlternateInteriorAngles);
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};
