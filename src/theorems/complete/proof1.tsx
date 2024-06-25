import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { comma, segmentStr } from "../../core/geometryText";
import { CongruentTriangles } from "../../core/templates/CongruentTriangles";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { ParallelLines } from "../../core/templates/ParallelLines";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { completeProof1 } from "../../questions/completeQuestions";
import { Reasons } from "../reasons";
import { linked, makeStepMeta } from "../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
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
        hoverable,
      })
    )
  );

  [
    new Triangle({ pts: [A, C, M], hoverable, label: "ACM" }, ctx),
    new Triangle({ pts: [B, D, M], hoverable, label: "BDM" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.push(new Segment({ p1: A, p2: B, hoverable: false }));
  ctx.push(new Segment({ p1: C, p2: D, hoverable: false }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
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
  },

  ticklessText: (ctx: Content) => {
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
  },
  staticText: () => {
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
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ACM").mode(props.frame, props.mode);
    props.ctx.getTriangle("BDM").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ParallelLines.additions(props, ["AC", "BD"]);
  },
  text: (props: StepTextProps) => ParallelLines.text(props, ["AC", "BD"]),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (props: StepTextProps) => {
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
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("AM").mode(props.frame, props.mode);
    props.ctx.getSegment("BM").mode(props.frame, props.mode);
    props.ctx.getSegment("CM").mode(props.frame, props.mode);
    props.ctx.getSegment("DM").mode(props.frame, props.mode);
  },
  staticText: () => {
    return (
      <span>
        {segmentStr("AB")}
        {" and "}
        {segmentStr("CD")}
        {" intersect at point M"}
      </span>
    );
  },
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AM", "BM"]);
    EqualSegments.additions(props, ["CM", "DM"], 2);
  },
  text: (props: StepTextProps) => {
    return (
      <span>
        {EqualSegments.text(props, ["AM", "BM"])}
        {comma}
        {EqualSegments.text(props, ["CM", "DM"], 2)}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {EqualSegments.staticText(["AM", "BM"])}
        {comma}
        {EqualSegments.staticText(["CM", "DM"])}
      </span>
    );
  },
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CMA", "DMB"]),
  text: (props: StepTextProps) => EqualAngles.text(props, ["CMA", "DMB"]),
  staticText: () => EqualAngles.staticText(["CMA", "DMB"]),
});

const step4SASProps: SASProps = {
  seg1s: { s: ["AM", "BM"], ticks: 1 },
  seg2s: { s: ["CM", "DM"], ticks: 2 },
  angles: { a: ["CMA", "DMB"] },
  triangles: ["ACM", "BDM"],
};
const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 3],
  additions: (props: StepFocusProps) => SAS.additions(props, step4SASProps),
  text: (props: StepTextProps) => SAS.text(props, step4SASProps),
  staticText: () => EqualTriangles.staticText(["ACM", "BDM"]),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingAngles,
  dependsOn: [4],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CAM", "DBM"], 2),
  text: (props: StepTextProps) => EqualAngles.text(props, ["CAM", "DBM"], 2),
  staticText: () => EqualAngles.staticText(["CAM", "DBM"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.AlternateInteriorAngles,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    ParallelLines.additions(props, ["AC", "BD"]),
  text: (props: StepTextProps) => ParallelLines.text(props, ["AC", "BD"]),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
});

const miniContent = () => {
  let ctx = baseContent(false, false);

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
  CMA.addTick(step3, Obj.EqualAngleTick).mode(step3, SVGModes.Purple);
  DMB.addTick(step3, Obj.EqualAngleTick).mode(step3, SVGModes.Blue);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step4 = ctx.addFrame("s4");
  SAS.additions(
    { ...defaultStepProps, frame: step4 },
    {
      seg1s: { s: ["AM", "BM"], ticks: 1 },
      seg2s: { s: ["CM", "DM"], ticks: 2 },
      angles: { a: ["CMA", "DMB"] },
      triangles: ["ACM", "BDM"],
    },
    SVGModes.Blue
  );

  // STEP 4 - CORRESPONDING ANGLES
  const step5 = ctx.addFrame("s5");
  CongruentTriangles.additions(
    { ...defaultStepProps, frame: step5, mode: SVGModes.Focused },
    {
      s1s: ["AM", "BM"],
      s2s: ["CM", "DM"],
      s3s: ["AC", "BD"],
      a1s: ["CMA", "DMB"],
      a2s: ["CAM", "DBM"],
      a3s: ["ACM", "BDM"],
    }
  );
  EqualAngles.additions(
    { ...defaultStepProps, frame: step5 },
    ["CAM", "DBM"],
    2,
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

export const P1: LayoutProps = {
  questions: completeProof1,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6],
};
