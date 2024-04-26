import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, Reason, SVGModes, Vector } from "../../../core/types";
import { Reasons } from "../../reasons";
import { CongruentTriangles } from "../../templates/CongruentTriangles";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { SAS } from "../../templates/SAS";
import { BaseStep, StepCls } from "../../utils";

const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [1, 0],
      [5, 0],
      [3, 4],
      [7, 4],
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "D", "B", "C"];
  const offsets: Vector[] = [
    [-15, -10],
    [10, -10],
    [-25, -10],
    [3, -10],
  ];
  const pts = coords[0];
  const [A, D, B, C] = pts.map((c, i) =>
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
    new Triangle({ pts: [A, B, D], parentFrame }, ctx),
    new Triangle({ pts: [B, C, D], parentFrame }, ctx),
  ].map((t) => ctx.push(t));
  return ctx;
};

class Givens implements BaseStep {
  text = (ctx: Content, frame?: string) => {
    const ADeqBC = EqualSegments.text(ctx, ["AD", "BC"], { frame });
    const ABeqDC = EqualSegments.text(ctx, ["AB", "DC"], { frame, num: 2 });
    const ABDeqCDB = EqualAngles.text(ctx, ["ABD", "CDB"], { frame });

    return (
      <span>
        {ADeqBC}
        {comma}
        {ABeqDC}
        {comma}
        {ABDeqCDB}
      </span>
    );
  };

  ticklessText = (ctx: Content) => {
    const ADeqBC = EqualSegments.ticklessText(ctx, ["AD", "BC"]);
    const ABeqDC = EqualSegments.ticklessText(ctx, ["AB", "DC"]);
    const ABDeqCDB = EqualAngles.ticklessText(ctx, ["ABD", "CDB"]);

    return (
      <span>
        {ADeqBC}
        {comma}
        {ABeqDC}
        {comma}
        {ABDeqCDB}
      </span>
    );
  };

  additions = (ctx: Content, frame: string, mode: SVGModes) => {
    ctx.getTriangle("ABD").mode(frame, mode);
    ctx.getTriangle("CDB").mode(frame, mode);
  };
  diagram = (ctx: Content, frame: string) => {
    this.additions(ctx, frame, SVGModes.Default);
  };
}

class Proves implements BaseStep {
  unfocused = (ctx: Content, frame: string) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    EqualAngles.additions(ctx, ["BAD", "DCB"], frame, mode, mode, inPlace);
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"], { frame });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };

  ticklessText = (ctx: Content) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"]);
  };
}

class S1 implements StepCls {
  unfocused = (ctx: Content, frame: string) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    EqualSegments.additions(ctx, ["AD", "BC"], frame, mode, mode, inPlace);
  };
  text = (ctx: Content, frame?: string) => {
    return EqualSegments.text(ctx, ["AD", "BC"], { frame });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

class S2 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused);
    new S1().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    EqualSegments.additions(ctx, ["AB", "DC"], frame, mode, mode, inPlace, 2);
  };
  text = (ctx: Content, frame?: string) => {
    return EqualSegments.text(ctx, ["AB", "DC"], { frame, num: 2 });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Default, inPlace);
  };
}

class S3 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new Givens().additions(ctx, frame, SVGModes.Unfocused);
    new S1().additions(ctx, frame, SVGModes.Unfocused, inPlace);
    new S2().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    EqualAngles.additions(ctx, ["ABD", "CDB"], frame, mode, mode, inPlace);
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["ABD", "CDB"], { frame });
  };

  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

class S4 implements StepCls {
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    new Givens().additions(ctx, frame, mode);
    new S1().additions(ctx, frame, mode, inPlace);
    new S2().additions(ctx, frame, mode, inPlace);
    new S3().additions(ctx, frame, mode, inPlace);
  };
  text = (ctx: Content, frame?: string) => {
    return SAS.text(
      ctx,
      {
        seg1s: ["AD", "BC"],
        seg2s: ["AB", "DC"],
        angles: ["ABD", "CDB"],
        triangles: ["ABD", "CDB"],
      },
      frame
    );
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

class S5 implements StepCls {
  unfocused = (ctx: Content, frame: string, inPlace = true) => {
    new S4().additions(ctx, frame, SVGModes.Unfocused, inPlace);
  };
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    EqualAngles.additions(ctx, ["BAD", "DCB"], frame, mode, mode, inPlace, 2);
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"], { frame, num: 2 });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

const miniContent = () => {
  let ctx = baseContent(false);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step4 = ctx.addFrame("s4");
  SAS.additions(
    ctx,
    {
      seg1s: ["BD", "BD"],
      seg2s: ["AB", "DC"],
      angles: ["ABD", "CDB"],
      triangles: ["ABD", "CDB"],
    },
    step4,
    SVGModes.Purple,
    SVGModes.Blue
  );

  // STEP 4 - CORRESPONDING ANGLES
  const step5 = ctx.addFrame("s5");
  CongruentTriangles.additions(
    ctx,
    step5,
    {
      s1s: ["AD", "BC"],
      s2s: ["AB", "DC"],
      s3s: ["BD", "BD"],
      a1s: ["ABD", "CDB"],
      a2s: ["BAD", "DCB"],
      a3s: ["ADB", "CBD"],
    },
    SVGModes.Default,
    SVGModes.Default
  );
  // step 4 ticks
  ctx
    .pushTick(ctx.getAngle("BAD"), Obj.EqualAngleTick, { num: 2 })
    .mode(step5, SVGModes.Purple);
  ctx
    .pushTick(ctx.getAngle("DCB"), Obj.EqualAngleTick, { num: 2 })
    .mode(step5, SVGModes.Blue);

  return ctx;
};

const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const r1 = `(1) AM ${strs.congruent} BM`;
  const r2 = `(1) CM ${strs.congruent} DM`;
  const r3 = `(2) ${strs.angle}CMA ${strs.congruent} ${strs.angle}DMB`;
  const r4 = `(3) ${strs.triangle}ACM ${strs.congruent} ${strs.triangle}BDM`;
  relies.set("s4", [r1, r2, r3]);
  relies.set("s5", [r4]);
  return relies;
};

const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("s4", Reasons.SAS);
  reasonMap.set("s5", Reasons.CorrespondingAngles);
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};

export const PC1 = {
  miniContent: miniContent(),
  reliesOnText: reliesOnText(),
  reasons,
  baseContent,
  Givens,
  Proves,
  S1,
  S2,
  S3,
  S4,
  S5,
};
