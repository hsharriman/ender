import { JSX } from "react/jsx-runtime";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, segmentStr, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../../core/types";
import { CongruentTriangles } from "../../templates/CongruentTriangles";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { ParallelLines } from "../../templates/ParallelLines";
import { SAS } from "../../templates/SAS";
import {
  BaseStep,
  StepCls,
  StepFocusProps,
  StepTextProps,
  StepUnfocusProps,
  linked,
} from "../../utils";
import { EqualTriangles } from "../../templates/EqualTriangles";

const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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

class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    const AM = props.ctx.getSegment("AM");
    const BM = props.ctx.getSegment("BM");
    const CM = props.ctx.getSegment("CM");
    const DM = props.ctx.getSegment("DM");

    return (
      <span>
        {linked("AB", AM, [BM])}
        {" and "}
        {linked("CD", CM, [DM])}
        {" intersect at "}
        {linked("M", props.ctx.getPoint("M"))}
        {comma}
        {EqualSegments.text(props, ["AM", "BM"])}
        {comma}
        {EqualSegments.text(props, ["CM", "DM"], 2)}
      </span>
    );
  };

  override ticklessText = (ctx: Content) => {
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
  override staticText = () => {
    return (
      <span>
        {segmentStr("AB")}
        {" and "}
        {segmentStr("CD")}
        {" intersect at point M"}
        {comma}
        {EqualSegments.staticText(["AM", "BM"])}
        {comma}
        {EqualSegments.staticText(["CM", "DM"])}
      </span>
    );
  };

  override additions = (props: StepFocusProps) => {
    props.ctx.getTriangle("ACM").mode(props.frame, props.mode);
    props.ctx.getTriangle("BDM").mode(props.frame, props.mode);
  };
  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
}

class Proves extends BaseStep {
  private ACBD: [string, string] = ["AC", "BD"];
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    ParallelLines.additions(props, this.ACBD);
  };
  override text = (props: StepTextProps) => {
    return ParallelLines.text(props, this.ACBD);
  };
  override staticText = () => ParallelLines.staticText(this.ACBD);
  override ticklessText = (ctx: Content) => {
    return ParallelLines.ticklessText(ctx, this.ACBD);
  };
}

class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AM", "BM"]);
    EqualSegments.additions(props, ["CM", "DM"], 2);
  };
  override text = (props: StepTextProps) => {
    return (
      <span>
        {EqualSegments.text(props, ["AM", "BM"])}
        {comma}
        {EqualSegments.text(props, ["CM", "DM"], 2)}
      </span>
    );
  };
  override staticText = () => {
    return (
      <span>
        {EqualSegments.staticText(["AM", "BM"])}
        {comma}
        {EqualSegments.staticText(["CM", "DM"])}
      </span>
    );
  };
}

class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override text = (props: StepTextProps) => {
    const AM = props.ctx.getSegment("AM");
    const BM = props.ctx.getSegment("BM");
    const CM = props.ctx.getSegment("CM");
    const DM = props.ctx.getSegment("DM");
    // TODO M highlights on wrong diagram in long-form
    return (
      <span>
        {linked("AB", AM, [BM])}
        {" and "}
        {linked("CD", CM, [DM])}
        {" intersect at "}
        {linked("M", props.ctx.getPoint("M"))}
      </span>
    );
  };
  override additions = (props: StepFocusProps) => {
    props.ctx.getSegment("AM").mode(props.frame, props.mode);
    props.ctx.getSegment("BM").mode(props.frame, props.mode);
    props.ctx.getSegment("CM").mode(props.frame, props.mode);
    props.ctx.getSegment("DM").mode(props.frame, props.mode);
  };
  override staticText = () => {
    return (
      <span>
        {segmentStr("AB")}
        {" and "}
        {segmentStr("CD")}
        {" intersect at point M"}
      </span>
    );
  };
}

class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
    new S1().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["CMA", "DMB"]);
  };
  override text = (props: StepTextProps) => {
    return EqualAngles.text(props, ["CMA", "DMB"]);
  };
  override staticText = () => EqualAngles.staticText(["CMA", "DMB"]);
}

class S4 extends StepCls {
  override additions = (props: StepFocusProps) => {
    SAS.additions(props, {
      seg1s: ["AM", "BM"],
      seg2s: ["CM", "DM"],
      angles: ["CMA", "DMB"],
      triangles: ["ACM", "BDM"],
    });
  };
  override text = (props: StepTextProps) => {
    return SAS.text(props, {
      seg1s: ["AM", "BM"],
      seg2s: ["CM", "DM"],
      angles: ["CMA", "DMB"],
      triangles: ["ACM", "BDM"],
    });
  };
  override staticText = () => EqualTriangles.staticText(["ACM", "BDM"]);
}

class S5 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S4().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["CAM", "DBM"], 2);
  };
  override text = (props: StepTextProps) => {
    return EqualAngles.text(props, ["CAM", "DBM"], 2);
  };
  override staticText = () => EqualAngles.staticText(["CAM", "DBM"]);
}

class S6 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S4().additions({ ...props, mode: SVGModes.Unfocused });
    new S5().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    ParallelLines.additions(props, ["AC", "BD"]);
  };
  override text = (props: StepTextProps) => {
    return ParallelLines.text(props, ["AC", "BD"]);
  };
  override staticText = () => ParallelLines.staticText(["AC", "BD"]);
}

const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };

  // STEP 2 - VERTICAL ANGLES
  const step3 = ctx.addFrame("s3");
  ctx.getTriangle("ACM").mode(step3, SVGModes.Focused);
  ctx.getTriangle("BDM").mode(step3, SVGModes.Focused);
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
  SAS.additions(
    { ...defaultStepProps, frame: step4 },
    {
      seg1s: ["AM", "BM"],
      seg2s: ["CM", "DM"],
      angles: ["CMA", "DMB"],
      triangles: ["ACM", "BDM"],
    },
    SVGModes.Blue
  );

  // STEP 4 - CORRESPONDING ANGLES
  const step5 = ctx.addFrame("s5");
  CongruentTriangles.additions(
    { ...defaultStepProps, frame: step5 },
    {
      s1s: ["AM", "BM"],
      s2s: ["CM", "DM"],
      s3s: ["AC", "BD"],
      a1s: ["CMA", "DMB"],
      a2s: ["CAM", "DBM"],
      a3s: ["ACM", "BDM"],
    },
    SVGModes.Blue
  );

  // STEP 5 - ALTERNATE ANGLES
  const step6 = ctx.addFrame("s6");
  ctx.getSegment("AM").mode(step6, SVGModes.Focused);
  ctx.getSegment("BM").mode(step6, SVGModes.Focused);
  EqualAngles.additions(
    { ...defaultStepProps, mode: SVGModes.Focused, frame: step6 },
    ["MAC", "MBD"]
  );
  ParallelLines.additions(
    { ...defaultStepProps, frame: step6 },
    ["AC", "BD"],
    1,
    SVGModes.Blue
  );

  return ctx;
};

const reliesOnText = () => {
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

export const P1 = {
  miniContent: miniContent(),
  reliesOnText: reliesOnText(),
  baseContent,
  Givens,
  Proves,
  S1,
  S2,
  S3,
  S4,
  S5,
  S6,
};
