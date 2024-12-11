import { Content } from "../../core/diagramContent";
import { ShowPoint } from "../../core/geometry/Point";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../core/reasons/EqualRightAngles";
import {
  EqualSegmentStep,
  EqualSegments,
} from "../../core/reasons/EqualSegments";
import { EqualTriangles } from "../../core/reasons/EqualTriangles";
import { Midpoint } from "../../core/reasons/Midpoint";
import { Reflexive } from "../../core/reasons/Reflexive";
import { RightAngle } from "../../core/reasons/RightAngle";
import { SAS, SASProps } from "../../core/reasons/SAS";
import { placeholder } from "../../core/testinfra/questions/testQuestions";
import { StepFocusProps, StepMeta } from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { Reasons } from "../reasons";
import { makeStepMeta } from "../utils";

export const baseContent = () => {
  const pts: Vector[] = [
    [1.5, 1], //A
    [3.5, 4.25], //B
    [5.5, 1], //C
    [3.5, 2.25], //D
    [3.5, 1], //E
    [3.5, -0.25], //G
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
  const [A, B, C, D, E, G] = pts.map((c, i) =>
    ctx.addPoint({
      pt: c,
      label: labels[i],
      offset: offsets[i],
      showPoint: ShowPoint.Adaptive,
    })
  );

  ctx.addTriangles([
    { pts: [A, B, E] },
    { pts: [B, E, C] },
    { pts: [D, E, C] },
    { pts: [G, E, C] },
  ]);

  // for given step:
  ctx.addSegment({ p1: B, p2: G });
  ctx.addAngle({ start: A, center: B, end: G });
  ctx.addAngle({ start: C, center: B, end: G });
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (isActive: boolean) => {
    return (
      <span>
        {RightAngle.text("AEB")(isActive)}
        {comma}
        {Midpoint.text("E", "AC")(isActive)}
        {comma}
        {EqualSegments.text(["DE", "EG"])(isActive)}
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
});

const proves: StepMeta = makeStepMeta({
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    EqualAngles.additions({ ...props, mode: SVGModes.Derived }, ["DCE", "GCE"]);
  },
  text: EqualAngles.text(["DCE", "GCE"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: givens,
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "AEB");
  },
  text: RightAngle.text("AEB"),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  prevStep: step1,
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "E", ["AE", "EC"]);
  },
  text: Midpoint.text("E", "AC"),
});

const step3: StepMeta = EqualSegmentStep(["DE", "EG"], Reasons.Given, step2, 2);

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step3,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "BE", 3);
  },
  text: Reflexive.text("BE"),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  prevStep: step4,
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "CE", 1);
  },
  text: Reflexive.text("CE"),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.CongAdjAngles,
  dependsOn: ["1"],
  prevStep: step5,
  additions: (props: StepFocusProps) =>
    EqualRightAngles.additions(props, ["AEB", "CEB"]),
  text: EqualRightAngles.text(["AEB", "CEB"]),
});

const s7SASProps: SASProps = {
  seg1s: { s: ["AE", "CE"], ticks: 1 },
  seg2s: { s: ["BE", "BE"], ticks: 3 },
  angles: { a: ["AEB", "CEB"], type: Obj.RightTick },
  triangles: ["AEB", "CEB"],
};
const step7: StepMeta = makeStepMeta({
  reason: Reasons.SAS,
  dependsOn: ["1", "2", "4"],
  prevStep: step6,
  additions: (props: StepFocusProps) => SAS.additions(props, s7SASProps),
  text: EqualTriangles.text(s7SASProps.triangles),
});

const step8: StepMeta = makeStepMeta({
  reason: Reasons.Empty,
  prevStep: step7,
  text: () => (
    <span style={{ color: "black", fontStyle: "italic" }}>
      Which step can be applied here?
    </span>
  ),
});

export const T1_CH1_IN1: LayoutProps = {
  name: "T1_CH1_IN1",
  questions: placeholder,
  shuffleQuestions: [],
  baseContent,
  givens,
  proves,
  steps: [step1, step2, step3, step4, step5, step6, step7, step8],
  title: "Challenge 1",
};
