import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Midpoint } from "../../core/templates/Midpoint";
import { Reflexive, ReflexiveStep } from "../../core/templates/Reflexive";
import { RightAngle } from "../../core/templates/RightAngle";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { placeholder } from "../../questions/funcTypeQuestions";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const coords: Vector[][] = [
    [
      [1.5, 1], //A
      [3.5, 4.25], //B
      [5.5, 1], //C
      [3.5, 2.25], //D
      [3.5, 1], //E
      [3.5, -0.25], //G
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D", "E", "G"];
  const offsets: Vector[] = [
    [-12, -15],
    [-20, -10],
    [5, -8],
    [-18, -5],
    [-18, -18],
    [-20, -5],
  ];
  const pts = coords[0];
  const [A, B, C, D, E, G] = pts.map((c, i) =>
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

  ctx.push(new Triangle({ pts: [A, B, E], hoverable, label: "AEB" }, ctx));
  ctx.push(new Triangle({ pts: [B, E, C], hoverable, label: "CEB" }, ctx));
  ctx.push(new Triangle({ pts: [D, E, C], hoverable, label: "DEC" }, ctx));
  ctx.push(new Triangle({ pts: [G, E, C], hoverable, label: "GEC" }, ctx));

  // for given step:
  ctx.push(new Segment({ p1: B, p2: G, hoverable: false }));
  ctx.push(new Angle({ start: A, center: B, end: G, hoverable }));
  ctx.push(new Angle({ start: C, center: B, end: G, hoverable }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (props: StepTextProps) => {
    return (
      <span>
        {RightAngle.text(props, "AEB")}
        {comma}
        {Midpoint.text(props, "AC", ["AE", "EC"], "E")}
        {comma}
        {EqualSegments.text(props, ["DE", "EG"])}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    return (
      <span>
        {RightAngle.ticklessText(ctx, "AEB")}
        {comma}
        {Midpoint.ticklessText(ctx, "AC", ["AE", "EC"], "E")}
        {comma}
        {EqualSegments.ticklessText(ctx, ["DE", "EG"])}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("AEB").mode(props.frame, props.mode);
    props.ctx.getTriangle("CEB").mode(props.frame, props.mode);
    props.ctx.getTriangle("DEC").mode(props.frame, props.mode);
    props.ctx.getTriangle("GEC").mode(props.frame, props.mode);
    props.ctx.getSegment("BG").mode(props.frame, SVGModes.Unfocused); // TODO this segment causes visual problems
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default });
  },
  staticText: () => {
    return (
      <span>
        {RightAngle.staticText("AEB")}
        {comma}
        {Midpoint.staticText("AC", "E")}
        {comma}
        {EqualSegments.staticText(["DE", "EG"])}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["DCE", "GCE"]);
  },
  text: (props: StepTextProps) => {
    return EqualAngles.text(props, ["DCE", "GCE"]);
  },
  staticText: () => EqualAngles.staticText(["DCE", "GCE"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "AEB");
  },
  text: (props: StepTextProps) => {
    return RightAngle.text(props, "AEB");
  },
  staticText: () => RightAngle.staticText("AEB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "E", ["AE", "EC"]);
  },
  text: (props: StepTextProps) => {
    return Midpoint.text(props, "AC", ["AE", "EC"], "E");
  },
  staticText: () => Midpoint.staticText("AC", "E"),
});

const step3: StepMeta = EqualSegmentStep(["DE", "EG"], Reasons.Given, step2, 2);

const step4: StepMeta = ReflexiveStep("BE", 3, step3);

const step5: StepMeta = ReflexiveStep("CE", 1, step4);

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step5.unfocused(props);
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["AEB", "CEB"]),
  text: (props: StepTextProps) => EqualRightAngles.text(props, ["AEB", "CEB"]),
  staticText: () => EqualRightAngles.staticText(["AEB", "CEB"]),
});

const s7SASProps: SASProps = {
  seg1s: { s: ["AE", "CE"], ticks: 1 },
  seg2s: { s: ["BE", "BE"], ticks: 3 },
  angles: { a: ["AEB", "CEB"], type: Obj.RightTick },
  triangles: ["AEB", "CEB"],
};
const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: [1, 2, 4],
  unfocused: (props: StepUnfocusProps) => {
    step6.unfocused(props);
  },
  additions: (props: StepFocusProps) => SAS.additions(props, s7SASProps),
  text: (props: StepTextProps) =>
    EqualTriangles.text(props, s7SASProps.triangles),
  staticText: () => EqualTriangles.staticText(s7SASProps.triangles),
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  unfocused: (props: StepUnfocusProps) => {
    step7.unfocused(props);
    step7.additions({ ...props, mode: SVGModes.Unfocused });
  },
  text: (props: StepTextProps) => (
    <span style={{ color: "black", fontStyle: "italic" }}>
      Which step can be applied here?
    </span>
  ),
  staticText: () => (
    <span style={{ fontStyle: "italic" }}>Which step can be applied here?</span>
  ),
});

const miniContent = () => {
  let ctx = baseContent(false, false);

  const s4 = ctx.addFrame("s4");
  Reflexive.additions({ ctx, frame: s4, mode: SVGModes.Purple }, "BE", 1);
  const s5 = ctx.addFrame("s5");
  ctx.push(
    new Segment({
      p1: ctx.getPoint("C"),
      p2: ctx.getPoint("A"),
      hoverable: false,
    })
  );
  Reflexive.additions({ ctx, frame: s5, mode: SVGModes.Purple }, "AC", 1);
  const s6 = ctx.addFrame("s6");
  ctx.getSegment("BE").mode(s6, SVGModes.Default);
  ctx.getSegment("CE").mode(s6, SVGModes.Default);
  ctx.getSegment("AE").mode(s6, SVGModes.Default);
  EqualRightAngles.additions(
    { ctx, frame: s6, mode: SVGModes.Purple },
    ["AEB", "CEB"],
    SVGModes.Blue
  );
  const s7 = ctx.addFrame("s7");
  SAS.additions(
    { ctx, frame: s7, mode: SVGModes.Purple },
    { ...s7SASProps, seg2s: { ...s7SASProps.seg2s, ticks: 2 } },
    SVGModes.Blue
  );
  return ctx;
};

export const IP3: LayoutProps = {
  // TODO: Replace questions
  questions: placeholder,
  miniContent: miniContent(),
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
};
