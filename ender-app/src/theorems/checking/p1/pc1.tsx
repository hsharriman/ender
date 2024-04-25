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
import { BaseStep } from "../../utils";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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

export class Givens implements BaseStep {
  unfocused(ctx: Content): Content {
    return ctx;
  }
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

  static additions = (ctx: Content, frame: string, mode: SVGModes) => {
    ctx.getTriangle("ABD").mode(frame, mode);
    ctx.getTriangle("CDB").mode(frame, mode);
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
    return EqualAngles.additions(
      ctx,
      ["BAD", "DCB"],
      frame,
      mode,
      mode,
      inPlace
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"], { frame });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame);
    this.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };

  ticklessText = (ctx: Content) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"]);
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
    return EqualSegments.additions(
      ctx,
      ["AD", "BC"],
      frame,
      mode,
      mode,
      inPlace
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualSegments.text(ctx, ["AD", "BC"], { frame });
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
    return EqualSegments.additions(
      ctx,
      ["AB", "DC"],
      frame,
      mode,
      mode,
      inPlace,
      2
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualSegments.text(ctx, ["AB", "DC"], { frame, num: 2 });
  };
  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame);
    return Step2.additions(ctx, frame, SVGModes.Default, inPlace);
  }
}

export class Step3 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Givens.additions(ctx, frame, SVGModes.Unfocused);
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
    return EqualAngles.additions(
      ctx,
      ["ABD", "CDB"],
      frame,
      mode,
      mode,
      inPlace
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["ABD", "CDB"], { frame });
  };

  diagram(ctx: Content, frame: string, inPlace = true): Content {
    this.unfocused(ctx, frame, inPlace);
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
    Givens.additions(ctx, frame, mode);
    Step1.additions(ctx, frame, mode, inPlace);
    Step2.additions(ctx, frame, mode, inPlace);
    Step3.additions(ctx, frame, mode, inPlace);
    return ctx;
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
    Step4.additions(ctx, frame, SVGModes.Focused, inPlace);
    return ctx;
  };
}

export class Step5 implements BaseStep {
  unfocused(ctx: Content, frame: string, inPlace = true): Content {
    Step4.additions(ctx, frame, SVGModes.Unfocused, inPlace);
    return ctx;
  }
  additions = (ctx: Content, frame: string, mode: SVGModes, inPlace = true) => {
    return EqualAngles.additions(
      ctx,
      ["BAD", "DCB"],
      frame,
      mode,
      mode,
      inPlace,
      2
    );
  };
  text = (ctx: Content, frame?: string) => {
    return EqualAngles.text(ctx, ["BAD", "DCB"], { frame, num: 2 });
  };
  diagram = (ctx: Content, frame: string, inPlace = true) => {
    this.unfocused(ctx, frame, inPlace);
    return this.additions(ctx, frame, SVGModes.Focused, inPlace);
  };
}

export const miniContent = () => {
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

export const reliesOnText = () => {
  let relies = new Map<string, string[]>();
  const r1 = `(1) AM ${strs.congruent} BM`;
  const r2 = `(1) CM ${strs.congruent} DM`;
  const r3 = `(2) ${strs.angle}CMA ${strs.congruent} ${strs.angle}DMB`;
  const r4 = `(3) ${strs.triangle}ACM ${strs.congruent} ${strs.triangle}BDM`;
  relies.set("s4", [r1, r2, r3]);
  relies.set("s5", [r4]);
  return relies;
};

export const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("s4", Reasons.SAS);
  reasonMap.set("s5", Reasons.CorrespondingAngles);
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};
