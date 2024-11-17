import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { comma } from "../../../core/geometryText";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { SAS } from "../../../core/reasons/SAS";
import { checkingProof1 } from "../../../core/testinfra/questions/funcTypeQuestions";
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
      [1, 2], // A
      [10, 2], // D
      [5, 9], // B
      [14, 9], // C
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
        hoverable,
      })
    )
  );

  [
    new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx),
    new Triangle({ pts: [B, C, D], hoverable, label: "CDB" }, ctx),
  ].map((t) => ctx.push(t));

  ctx.setAspect(AspectRatio.Landscape);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    const ADeqBC = EqualSegments.text(["AD", "BC"])(isActive);
    const ABeqDC = EqualSegments.text(["AB", "DC"])(isActive);
    const ABDeqCDB = EqualAngles.text(["ABD", "CDB"])(isActive);

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
  text: EqualAngles.text(["BAD", "DCB"]),
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AD", "BC"]);
  },
  text: EqualSegments.text(["AD", "BC"]),
  staticText: () => EqualSegments.staticText(["AD", "BC"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(addProps);
    step1.additions(addProps);
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["AB", "DC"], 2);
  },
  text: EqualSegments.text(["AB", "DC"]),
  staticText: () => EqualSegments.staticText(["AB", "DC"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    const addProps = { ...props, mode: SVGModes.Unfocused };
    givens.additions(addProps);
    step1.additions(addProps);
    step2.additions(addProps);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CDB"]);
  },
  text: EqualAngles.text(["ABD", "CDB"]),
  staticText: () => EqualAngles.staticText(["ABD", "CDB"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [1, 2, 3],
  additions: (props: StepFocusProps) => {
    givens.additions(props);
    step1.additions(props);
    step2.additions(props);
    step3.additions(props);
  },
  text: EqualTriangles.text(["ABD", "CDB"]),
  staticText: () => EqualTriangles.staticText(["ABD", "CDB"]),
  highlight: (ctx: Content, frame: string) =>
    SAS.highlight(ctx, frame, {
      seg1s: { s: ["AD", "BC"] },
      seg2s: { s: ["AB", "DC"], ticks: 2 },
      angles: { a: ["BAD", "BCD"] },
      triangles: ["ABD", "CDB"],
    }),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [4],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["BAD", "DCB"], 2);
  },
  text: EqualAngles.text(["BAD", "DCB"]),
  staticText: () => EqualAngles.staticText(["BAD", "DCB"]),
  highlight: (ctx: Content, frame: string) =>
    CongruentTriangles.highlight(ctx, frame, {
      s1s: ["AD", "BC"],
      s2s: ["AB", "DC"],
      s3s: ["BD", "BD"],
      a1s: ["ABD", "CDB"],
      a2s: ["BAD", "DCB"],
      a3s: ["ADB", "CBD"],
    }),
});

export const T1_S1_IN1: LayoutProps = {
  name: "T1_S1_IN1",
  questions: checkingProof1,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5],
  title: "Prove Angles Congruent #1[M]",
};
