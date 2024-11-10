import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Segment } from "../../../core/geometry/Segment";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma, segmentStr } from "../../../core/geometryText";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { ParallelLines } from "../../../core/reasons/ParallelLines";
import { SAS, SASProps } from "../../../core/reasons/SAS";
import { completeProof1 } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { BGColors, chipText, makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [5, 9], // A
      [10, 2], // B
      [1, 3], // C
      [14, 8], // D
      [7.5, 5.5], // M
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

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: () => {
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
    props.ctx.getTriangle("ACM").mode(props.frame, SVGModes.Default);
    props.ctx.getTriangle("BDM").mode(props.frame, SVGModes.Default);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({
      ctx,
      frame,
      mode: SVGModes.Default,
      mode2: SVGModes.Default,
    });
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({
      ...props,
      mode: SVGModes.Unfocused,
      mode2: SVGModes.Unfocused,
    });
  },
  additions: (props: StepFocusProps) => {
    ParallelLines.additions(props, ["AC", "BD"]);
  },
  text: ParallelLines.text(["AC", "BD"]),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({
      ...props,
      mode: SVGModes.Unfocused,
      mode2: SVGModes.Unfocused,
    });
  },
  text: (isActive: boolean) => {
    return (
      <span>
        {chipText(Obj.Segment, "AB", BGColors.Blue, isActive)}
        {" and "}
        {chipText(Obj.Segment, "CD", BGColors.Purple, isActive)}
        {" intersect at M"}
      </span>
    );
  },
  additions: (props: StepFocusProps) => {
    props.ctx.getSegment("AM").mode(props.frame, SVGModes.Blue);
    props.ctx.getSegment("BM").mode(props.frame, SVGModes.Blue);
    props.ctx.getSegment("CM").mode(props.frame, SVGModes.Purple);
    props.ctx.getSegment("DM").mode(props.frame, SVGModes.Purple);
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
    givens.additions({
      ...props,
      mode: SVGModes.Unfocused,
      mode2: SVGModes.Unfocused,
    });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AM", "BM"]),
  text: EqualSegments.text(["AM", "BM"]),
  staticText: () => EqualSegments.staticText(["AM", "BM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({
      ...props,
      mode: SVGModes.Unfocused,
      mode2: SVGModes.Unfocused,
    });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["CM", "DM"], 2),
  text: EqualSegments.text(["CM", "DM"]),
  staticText: () => EqualSegments.staticText(["CM", "DM"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({
      ...props,
      mode: SVGModes.Unfocused,
      mode2: SVGModes.Unfocused,
    });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CMA", "DMB"]),
  text: EqualAngles.text(["CMA", "DMB"]),
  staticText: () => EqualAngles.staticText(["CMA", "DMB"]),
});

const step4SASProps: SASProps = {
  seg1s: { s: ["AM", "BM"], ticks: 1 },
  seg2s: { s: ["CM", "DM"], ticks: 2 },
  angles: { a: ["CMA", "DMB"] },
  triangles: ["ACM", "BDM"],
};
const step5: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [2, 3, 4],
  additions: (props: StepFocusProps) => SAS.additions(props, step4SASProps),
  text: EqualTriangles.text(step4SASProps.triangles),
  staticText: () => EqualTriangles.staticText(["ACM", "BDM"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({
      ...props,
      mode: SVGModes.Unfocused,
    });
    EqualTriangles.unfocused(props, ["ACM", "BDM"]);
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["CAM", "DBM"], 2),
  text: EqualAngles.text(["CAM", "DBM"]),
  staticText: () => EqualAngles.staticText(["CAM", "DBM"]),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.ConverseAltInteriorAngs,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({
      ...props,
      mode: SVGModes.Unfocused,
    });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    ParallelLines.additions(props, ["AC", "BD"]);
    props.ctx.getSegment("AM").mode(props.frame, SVGModes.Focused);
    props.ctx.getSegment("BM").mode(props.frame, SVGModes.Focused);
  },
  text: ParallelLines.text(["AC", "BD"]),
  staticText: () => ParallelLines.staticText(["AC", "BD"]),
});

export const T1_S1_C1: LayoutProps = {
  name: "T1_S1_C1",
  questions: completeProof1,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7],
  title: "Prove Segments Parallel #1",
};
