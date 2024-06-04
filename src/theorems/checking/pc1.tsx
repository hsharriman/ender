import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { CongruentTriangles } from "../../core/templates/CongruentTriangles";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { SAS } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../core/types/types";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

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

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
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
  },

  ticklessText: (ctx: Content) => {
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
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CDB").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AD", "BC"])}
        {comma}
        {EqualSegments.staticText(["AB", "DC"])}
        {comma}
        {EqualAngles.staticText(["ABD", "CDB"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"]);
  },
  text: (props: StepTextProps) => {
    return EqualAngles.text(props, ["BAD", "DCB"]);
  },
  ticklessText: (ctx: Content) => {
    return EqualAngles.ticklessText(ctx, ["BAD", "DCB"]);
  },
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
});

const step1: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "BC"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["AD", "BC"]);
  },
  staticText: () => EqualSegments.staticText(["AD", "BC"]),
});

const step2: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(addProps);
    step1.additions(addProps);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "DC"], 2);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["AB", "DC"], 2);
  },
  staticText: () => EqualSegments.staticText(["AB", "DC"]),
});

const step3: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(addProps);
    step1.additions(addProps);
    step2.additions(addProps);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CDB"]);
  },
  text: (props: StepTextProps) => {
    return EqualAngles.text(props, ["ABD", "CDB"]);
  },
  staticText: () => EqualAngles.staticText(["ABD", "CDB"]),
});

const step4: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
    step1.additions(props);
    step2.additions(props);
    step3.additions(props);
  },
  text: (props: StepTextProps) => {
    return SAS.text(props, {
      seg1s: ["AD", "BC"],
      seg2s: ["AB", "DC"],
      angles: ["ABD", "CDB"],
      triangles: ["ABD", "CDB"],
    });
  },
  staticText: () => EqualTriangles.staticText(["ABD", "CDB"]),
});

const step5: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"], 2);
  },
  text: (props: StepTextProps) => {
    return EqualAngles.text(props, ["BAD", "DCB"], 2);
  },
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
});

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

// TODO remove
// const reliesOnText = () => {
//   let relies = new Map<string, string[]>();
//   const r1 = `(1) AM ${strs.congruent} BM`;
//   const r2 = `(1) CM ${strs.congruent} DM`;
//   const r3 = `(2) ${strs.angle}CMA ${strs.congruent} ${strs.angle}DMB`;
//   const r4 = `(3) ${strs.triangle}ACM ${strs.congruent} ${strs.triangle}BDM`;
//   relies.set("s4", [r1, r2, r3]);
//   relies.set("s5", [r4]);
//   return relies;
// };

export const PC1: LayoutProps = {
  miniContent: miniContent(),
  // reliesOnText: reliesOnText(),
  baseContent,
  givens,
  proves,
  steps: [
    { meta: step1, reason: Reasons.Given },
    { meta: step2, reason: Reasons.Given },
    { meta: step3, reason: Reasons.Given },
    {
      meta: step4,
      reason: Reasons.SAS,
      dependsOn: [1, 2, 3],
    },
    {
      meta: step5,
      reason: Reasons.CorrespondingAngles,
      dependsOn: [4],
    },
  ],
};
