import { JSX } from "react/jsx-runtime";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, strs } from "../../../core/geometryText";
import { Content } from "../../../core/objgraph";
import { SVGModes, Vector } from "../../../core/types";
import { CongruentTriangles } from "../../templates/CongruentTriangles";
import { EqualAngles } from "../../templates/EqualAngles";
import { EqualSegments } from "../../templates/EqualSegments";
import { SAS } from "../../templates/SAS";
import {
  BaseStep,
  StepCls,
  StepFocusProps,
  StepTextProps,
  StepUnfocusProps,
} from "../../utils";
import { EqualTriangles } from "../../templates/EqualTriangles";

const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
  const coords: Vector[][] = [
    [
      [1, 0],
      [5, 0],
      [3, 3],
      [7, 3],
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

class Givens extends BaseStep {
  override text = (props: StepTextProps) => {
    const ADeqBC = EqualSegments.text(props, ["AD", "BC"]);
    const ABeqDC = EqualSegments.text(props, ["AB", "DC"], 2);
    const ABDeqCDB = EqualAngles.text(props, ["ABD", "CDB"]);

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

  override ticklessText = (ctx: Content) => {
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

  override additions = (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CDB").mode(props.frame, props.mode);
  };
  override diagram = (ctx: Content, frame: string) => {
    this.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  };
  override staticText = () => {
    return (
      <span>
        {EqualSegments.staticText(["AD", "BC"])}
        {comma}
        {EqualSegments.staticText(["AB", "DC"])}
        {comma}
        {EqualAngles.staticText(["ABD", "CDB"])}
      </span>
    );
  };
}

class Proves extends BaseStep {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"]);
  };
  override text = (props: StepTextProps) => {
    return EqualAngles.text(props, ["BAD", "DCB"]);
  };
  override ticklessText = (ctx: Content) => {
    return EqualAngles.ticklessText(ctx, ["BAD", "DCB"]);
  };
  override staticText = () => EqualAngles.staticText(["BAD", "DCB"]);
}

class S1 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new Givens().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "BC"]);
  };
  override text = (props: StepTextProps) => {
    return EqualSegments.text(props, ["AD", "BC"]);
  };
  override staticText = () => EqualSegments.staticText(["AD", "BC"]);
}

class S2 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(addProps);
    new S1().additions(addProps);
  };
  override additions = (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "DC"], 2);
  };
  override text = (props: StepTextProps) => {
    return EqualSegments.text(props, ["AB", "DC"], 2);
  };
  override staticText = () => EqualSegments.staticText(["AB", "DC"]);
}

class S3 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    new Givens().additions(addProps);
    new S1().additions(addProps);
    new S2().additions(addProps);
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CDB"]);
  };
  override text = (props: StepTextProps) => {
    return EqualAngles.text(props, ["ABD", "CDB"]);
  };
  override staticText = () => EqualAngles.staticText(["ABD", "CDB"]);
}

class S4 extends StepCls {
  override additions = (props: StepFocusProps) => {
    new Givens().additions(props);
    new S1().additions(props);
    new S2().additions(props);
    new S3().additions(props);
  };
  override text = (props: StepTextProps) => {
    return SAS.text(props, {
      seg1s: ["AD", "BC"],
      seg2s: ["AB", "DC"],
      angles: ["ABD", "CDB"],
      triangles: ["ABD", "CDB"],
    });
  };
  override staticText = () => EqualTriangles.staticText(["ABD", "CDB"]);
}

class S5 extends StepCls {
  override unfocused = (props: StepUnfocusProps) => {
    new S4().additions({ ...props, mode: SVGModes.Unfocused });
  };
  override additions = (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"], 2);
  };
  override text = (props: StepTextProps) => {
    return EqualAngles.text(props, ["BAD", "DCB"], 2);
  };
  override staticText = () => EqualAngles.staticText(["BAD", "DCB"]);
}

const miniContent = () => {
  let ctx = baseContent(false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };
  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step4 = ctx.addFrame("s4");
  SAS.additions(
    { ...defaultStepProps, frame: step4 },
    {
      seg1s: ["BD", "BD"],
      seg2s: ["AB", "DC"],
      angles: ["ABD", "CDB"],
      triangles: ["ABD", "CDB"],
    },
    SVGModes.Blue
  );

  // STEP 4 - CORRESPONDING ANGLES
  const step5 = ctx.addFrame("s5");
  CongruentTriangles.additions(
    { ...defaultStepProps, frame: step5, mode: SVGModes.Focused },
    {
      s1s: ["AD", "BC"],
      s2s: ["AB", "DC"],
      s3s: ["BD", "BD"],
      a1s: ["ABD", "CDB"],
      a2s: ["BAD", "DCB"],
      a3s: ["ADB", "CBD"],
    }
  );
  // step 4 ticks
  EqualAngles.additions(
    { ...defaultStepProps, frame: step5 },
    ["BAD", "DCB"],
    2,
    SVGModes.Blue
  );

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

export const PC1 = {
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
};
