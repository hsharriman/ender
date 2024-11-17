import { Content } from "../../../core/diagramContent";
import { AspectRatio } from "../../../core/diagramSvg/svgTypes";
import { Angle } from "../../../core/geometry/Angle";
import { Point } from "../../../core/geometry/Point";
import { Triangle } from "../../../core/geometry/Triangle";
import { angleStr, comma, segmentStr } from "../../../core/geometryText";
import { ASA, ASAProps } from "../../../core/reasons/ASA";
import { BaseAngle } from "../../../core/reasons/BaseAngle";
import { CongruentTriangles } from "../../../core/reasons/CongruentTriangles";
import { EqualAngles } from "../../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../../core/reasons/EqualTriangles";
import { Midpoint } from "../../../core/reasons/Midpoint";
import { Perpendicular } from "../../../core/reasons/Perpendicular";
import { Reflexive } from "../../../core/reasons/Reflexive";
import { RightAngle } from "../../../core/reasons/RightAngle";
import { completeProof2 } from "../../../core/testinfra/questions/funcTypeQuestions";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../../core/types/types";
import { Reasons } from "../../reasons";
import { BGColors, makeStepMeta } from "../../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [2, 1], // A
      [5.5, 8], // B
      [9, 1], // C
      [5.5, 1], // D
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D"];
  const offsets: Vector[] = [
    [-15, -15],
    [0, 5],
    [0, -17],
    [-5, -18],
  ];
  const pts = coords[0];
  const [A, B, C, D] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [A, B, D], hoverable, label: "ABD" }, ctx));
  ctx.push(new Triangle({ pts: [C, B, D], hoverable, label: "CBD" }, ctx));

  // for given step:
  ctx.push(new Angle({ start: A, center: B, end: C, hoverable }));

  ctx.setAspect(AspectRatio.Square);
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {RightAngle.text("ADB")(isActive)}
        {comma}
        {segmentStr("BD")}
        <span className="font-notoSans">&nbsp;bisects&nbsp;</span>
        {BaseAngle.text("ABC", BGColors.Blue)(isActive)}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("ABD").mode(props.frame, props.mode);
    props.ctx.getTriangle("CBD").mode(props.frame, props.mode);
  },

  staticText: () => {
    return (
      <span>
        {RightAngle.staticText("ADB")}
        {comma}
        {segmentStr("BD")}
        {" bisects "}
        {angleStr("ABC")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "D", ["AD", "CD"]);
  },
  text: Midpoint.text("AC", "D"),
  staticText: () => Midpoint.staticText("D", "AC"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "ADB");
  },
  text: RightAngle.text("ADB"),
  staticText: () => RightAngle.staticText("ADB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.additions({ ...props, mode: SVGModes.Unfocused });
    step1.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["ABD", "CBD"]);
  },
  text: (isActive: boolean) => {
    return step2.staticText();
  },
  staticText: () => (
    <span>
      {segmentStr("BD")} bisects {angleStr("ABC")}
    </span>
  ),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.PerpendicularLines,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    Perpendicular.additions(props, "BD", ["AD", "DC"]),
  text: Perpendicular.text("AC", "BD"),
  staticText: () => Perpendicular.staticText("BD", "AC"),
  highlight: (ctx: Content, frame: string) =>
    Perpendicular.highlight(ctx, frame, "BD", ["AD", "DC"]),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [3],
  unfocused: (props: StepUnfocusProps) => {
    step3.additions({ ...props, mode: SVGModes.Unfocused });
    step3.unfocused(props);
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["ADB", "BDC"]),
  text: EqualRightAngles.text(["ADB", "BDC"]),
  staticText: () => EqualRightAngles.staticText(["ADB", "BDC"]),
  highlight: (ctx: Content, frame: string) => {
    Perpendicular.highlight(ctx, frame, "BD", ["AD", "DC"]);
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"]);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
    step4.unfocused(props);
  },
  additions: (props: StepFocusProps) => Reflexive.additions(props, "BD"),
  text: Reflexive.text("BD"),
  staticText: () => Reflexive.staticText("BD"),
  highlight: (ctx: Content, frame: string) =>
    Reflexive.highlight(ctx, frame, "BD"),
});

const step5ASAProps: ASAProps = {
  a1s: { a: ["ADB", "BDC"], type: Obj.RightTick },
  a2s: { a: ["ABD", "CBD"], type: Obj.EqualAngleTick },
  segs: { s: ["BD", "BD"] },
  triangles: ["ABD", "CBD"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [2, 4, 5],
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step5ASAProps);
  },
  text: EqualTriangles.text(["ABD", "CBD"]),
  staticText: () => EqualTriangles.staticText(["ABD", "CBD"]),
  highlight: (ctx: Content, frame: string) =>
    ASA.highlight(ctx, frame, step5ASAProps),
});

const step7: StepMeta = makeStepMeta({
  reason: Reasons.CPCTC,
  dependsOn: [6],
  unfocused: (props: StepUnfocusProps) => {
    step6.additions({
      ...props,
      mode: SVGModes.Unfocused,
    });
  },
  additions: (props: StepFocusProps) =>
    EqualSegments.additions(props, ["AD", "DC"], 2),
  text: EqualSegments.text(["AD", "DC"]),
  staticText: () => EqualSegments.staticText(["AD", "DC"]),
  highlight: (ctx: Content, frame: string) => {
    CongruentTriangles.highlight(ctx, frame, {
      s1s: ["BD", "BD"],
      s2s: ["AD", "DC"],
      s3s: ["AB", "CB"],
      a1s: ["ADB", "BDC"],
      a2s: ["ABD", "CBD"],
      a3s: ["BAD", "BCD"],
    });
    EqualRightAngles.highlight(ctx, frame, ["ADB", "BDC"]);
  },
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.ConverseMidpoint,
  dependsOn: [7],
  unfocused: (props: StepUnfocusProps) => {
    step7.unfocused(props);
  },
  additions: (props: StepFocusProps) => step7.additions(props),
  text: Midpoint.text("AC", "D"),
  staticText: () => Midpoint.staticText("D", "AC"),
  highlight: (ctx: Content, frame: string) =>
    Midpoint.highlight(ctx, frame, "D", ["AD", "DC"], 2),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Blue,
  };

  const focusProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Focused,
  };

  // STEP 2 - PERPENDICULAR LINES
  const step2 = ctx.addFrame("s3");
  const BD = ctx.getSegment("BD").mode(step2, SVGModes.Focused);
  const AD = ctx.getSegment("AD").mode(step2, SVGModes.Focused);
  const CD = ctx.getSegment("CD").mode(step2, SVGModes.Focused);
  RightAngle.additions({ ...defaultStepProps, frame: step2 }, "ADB");

  const step3 = ctx.addFrame("s4");
  BD.mode(step3, SVGModes.Focused);
  AD.mode(step3, SVGModes.Focused);
  CD.mode(step3, SVGModes.Focused);
  EqualRightAngles.additions({ ...defaultStepProps, frame: step3 }, [
    "ADB",
    "BDC",
  ]);

  // STEP 3 - REFLEXIVE PROPERTY
  const step4 = ctx.addFrame("s5");
  Reflexive.additions({ ...defaultStepProps, frame: step4 }, "BD");

  // STEP 4 - ASA CONGRUENCE
  const step5 = ctx.addFrame("s6");
  ASA.additions(
    { ...defaultStepProps, frame: step5 },
    {
      a1s: { a: ["ADB", "BDC"], type: Obj.RightTick },
      a2s: { a: ["ABD", "CBD"], type: Obj.EqualAngleTick },
      segs: { s: ["BD", "BD"] },
      triangles: ["ABD", "CBD"],
    }
  );

  // STEP 5 - CORRESPONDING SEGMENTS
  const step6 = ctx.addFrame("s7");
  EqualAngles.additions({ ...focusProps, frame: step6 }, ["ABD", "CBD"]);
  Reflexive.additions({ ...focusProps, frame: step6 }, "BD");
  EqualRightAngles.additions({ ...focusProps, frame: step6 }, ["ADB", "BDC"]);
  EqualAngles.additions({ ...focusProps, frame: step6 }, ["ABD", "CBD"]);
  EqualAngles.additions({ ...focusProps, frame: step6 }, ["BAD", "BCD"], 2);
  EqualSegments.additions(
    { ...defaultStepProps, frame: step6 },
    ["AD", "DC"],
    2
  );
  EqualSegments.additions({ ...focusProps, frame: step6 }, ["AB", "CB"], 3);

  // STEP 6 - MIDPOINT
  const step7 = ctx.addFrame("s8");
  AD.mode(step7, SVGModes.Purple);
  CD.mode(step7, SVGModes.Blue);
  AD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Purple);
  CD.addTick(step7, Obj.EqualLengthTick, 2).mode(step7, SVGModes.Blue);

  return ctx;
};

export const T1_S1_C2: LayoutProps = {
  name: "T1_S1_C2",
  questions: completeProof2,
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Prove Midpoint #1",
};
