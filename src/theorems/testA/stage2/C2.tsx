import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { EqualAngles, EqualAngleStep } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import {
  EqualSegments,
  EqualSegmentStep,
} from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { ReflexiveStep } from "../../../core/reasons/Reflexive";
import { exploratoryQuestion } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { makeStepMeta } from "../../utils";

const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [1, 9], // F
      [2, 1], // A
      [5.5, 6], // B
      [9, 1], // C
      [5.5, 1], // D
      [10, 9], // G
    ],
  ];
  let ctx = new Content();
  const labels = ["F", "A", "B", "C", "D", "G"];
  const offsets: Vector[] = [
    [-12, 0],
    [-10, -15],
    [-3, 10],
    [-3, -15],
    [-5, -18],
    [3, 0],
  ];
  const pts = coords[0];
  const [F, A, B, C, D, G] = pts.map((c, i) =>
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
    new Triangle({ pts: [A, B, F], hoverable, label: "ABF" }, ctx),
    new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx),
    new Triangle({ pts: [B, C, D], hoverable, label: "BCD" }, ctx),
    new Triangle({ pts: [B, C, G], hoverable, label: "BCG" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {Perpendicular.text("AC", "BD")(isActive)}
        {comma}
        {EqualSegments.text(["AD", "DC"])(isActive)}
        {comma}
        {EqualAngles.text(["FAB", "GCB"])(isActive)}
        {comma}
        {EqualSegments.text(["AF", "CG"])(isActive)}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {Perpendicular.staticText("AC", "BD")}
        {comma}
        {EqualSegments.staticText(["AD", "DC"])}
        {comma}
        {EqualAngles.staticText(["FAB", "GCB"])}
        {comma}
        {EqualSegments.staticText(["AF", "CG"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABF").mode(props.frame, props.mode);
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCD").mode(props.frame, props.mode);
    props.ctx.getTriangle("BCG").mode(props.frame, props.mode);
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualAngles.additions(props, ["AFB", "CGB"]),
  text: EqualAngles.text(["AFB", "CGB"]),
  staticText: () => EqualAngles.staticText(["AFB", "CGB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: Perpendicular.text("AC", "BD"),
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "CD"]),
  staticText: () => Perpendicular.staticText("AC", "BD"),
});

const step2: StepMeta = EqualSegmentStep(["AD", "DC"], Reasons.Given, step1);
const step3: StepMeta = EqualAngleStep(["FAB", "GCB"], Reasons.Given, step2);
const step4: StepMeta = EqualSegmentStep(["AF", "CG"], Reasons.Given, step3, 2);
const step5: StepMeta = ReflexiveStep("BD", 3, step4);

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  unfocused: (props: StepUnfocusProps) => {
    step5.additions({ ...props, mode: SVGModes.Unfocused });
    step5.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "BD", ["AD", "CD"]);
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"]);
  },
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["2", "5", "6"],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({ ...props, mode: SVGModes.Unfocused });
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step2.additions(props);
    step5.additions(props);
    step6.additions(props);

    props.ctx.getSegment("AB").mode(props.frame, props.mode);
    props.ctx.getSegment("CB").mode(props.frame, props.mode);
  },
  text: EqualTriangles.text(["ABD", "BCD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "BCD"]),
  highlight: (ctx: Content, frame: string) => {
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"]);
    EqualSegments.highlight(ctx, frame, ["AD", "DC"]);
    EqualSegments.highlight(ctx, frame, ["BD", "BD"], 3);
  },
});

const step8: StepMeta = makeStepMeta({
  ...EqualSegmentStep(["AB", "BC"], Reasons.CPCTC, step7, 4, ["7"]),
  highlight: (ctx: Content, frame: string) => {
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"]);
    EqualAngles.highlight(ctx, frame, ["DAB", "DCB"], 2);
    EqualAngles.highlight(ctx, frame, ["ABD", "CBD"]);
    EqualSegments.highlight(ctx, frame, ["AD", "DC"]);
    EqualSegments.highlight(ctx, frame, ["BD", "BD"], 3);
    EqualSegments.highlight(ctx, frame, ["BC", "AB"], 4);
  },
});
const step9: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["3", "4", "8"],
  unfocused: (props: StepUnfocusProps) => {
    step8.additions({ ...props, mode: SVGModes.Unfocused });
    step8.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    step3.additions(props);
    step4.additions(props);
    step8.additions(props);
    props.ctx.getSegment("FB").mode(props.frame, props.mode);
    props.ctx.getSegment("GB").mode(props.frame, props.mode);
  },
  text: EqualTriangles.text(["ABF", "BCG"]),
  staticText: () => EqualTriangles.staticText(["ABF", "BCG"]),
  highlight: (ctx: Content, frame: string) => {
    EqualAngles.highlight(ctx, frame, ["FAB", "BCG"]);
    EqualSegments.highlight(ctx, frame, ["FA", "GC"], 2);
    EqualSegments.highlight(ctx, frame, ["AB", "BC"], 4);
  },
});

const step10: StepMeta = makeStepMeta({
  ...EqualAngleStep(["AFB", "CGB"], Reasons.CPCTC, step9, 2, ["9"]),
  highlight: (ctx: Content, frame: string) => {
    EqualAngles.highlight(ctx, frame, ["FAB", "BCG"]);
    EqualSegments.highlight(ctx, frame, ["FA", "GC"], 2);
    EqualSegments.highlight(ctx, frame, ["AB", "BC"], 4);
    EqualSegments.highlight(ctx, frame, ["FB", "GB"], 5);
    EqualAngles.highlight(ctx, frame, ["AFB", "CGB"], 2);
    EqualAngles.highlight(ctx, frame, ["FBA", "GBC"], 3);
  },
});

export const T1_S2_C2: LayoutProps = {
  name: "T1_S2_C2",
  questions: exploratoryQuestion(5, 10),
  baseContent,
  givens,
  proves,
  steps: [
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
    step8,
    step9,
    step10,
  ],
  title: "Prove Angles Congruent #2",
};
