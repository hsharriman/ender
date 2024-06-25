import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { BaseGeometryObject } from "../../core/geometry/BaseGeometryObject";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { comma } from "../../core/geometryText";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { Reflexive } from "../../core/templates/Reflexive";
import { RightAngle } from "../../core/templates/RightAngle";
import { SAS, SASProps } from "../../core/templates/SAS";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { checkingProof3 } from "../../questions/checkingQuestions";
import { Reasons } from "../reasons";
import { linked, makeStepMeta } from "../utils";

export const baseContent = (labeledPoints: boolean, hoverable: boolean) => {
  const pts: Vector[] = [
    [1, 0], // L BL
    [1, 3], // M TL
    [6, 0], // K BR
    [6, 3], // N TR
  ];
  let ctx = new Content();
  const labels = ["L", "M", "K", "N"];
  const offsets: Vector[] = [
    [-15, -15],
    [-10, 5],
    [0, -17],
    [8, 0],
  ];
  const [L, M, K, N] = pts.map((c, i) => {
    // TODO option to make point labels invisible
    return ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
        hoverable,
      })
    );
  });
  ctx.push(new Triangle({ pts: [L, M, K], hoverable, label: "KLM" }, ctx));
  ctx.push(new Triangle({ pts: [K, N, M], hoverable, label: "MNK" }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: L, center: M, end: N, hoverable }));
  ctx.push(new Angle({ start: L, center: K, end: N, hoverable }));
  return ctx;
};

const givens: StepMeta = makeStepMeta({
  text: (props: StepTextProps) => {
    const LK = props.ctx.getSegment("LK");
    const LM = props.ctx.getSegment("LM");
    const MN = props.ctx.getSegment("MN");
    const NK = props.ctx.getSegment("NK");

    return (
      <span>
        {linked(
          "KLMN",
          new BaseGeometryObject(Obj.Quadrilateral, { hoverable: false }),
          [LK, LM, MN, NK]
        )}
        {" is a quadrilateral"}
        {comma}
        {EqualSegments.text(props, ["LM", "NK"])}
        {comma}
        {RightAngle.text(props, "KLM")}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const LK = ctx.getSegment("LK");
    const LM = ctx.getSegment("LM");
    const MN = ctx.getSegment("MN");
    const NK = ctx.getSegment("NK");

    return (
      <span>
        {linked(
          "EFGH",
          new BaseGeometryObject(Obj.Quadrilateral, { hoverable: false }),
          [LK, LM, MN, NK]
        )}
        {" is a quadrilateral"}
        {comma}
        {EqualSegments.ticklessText(ctx, ["LM", "NK"])}
        {comma}
        {RightAngle.ticklessText(ctx, "KLM")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("LMK").mode(props.frame, props.mode);
    props.ctx.getTriangle("KMN").mode(props.frame, props.mode);
  },
  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
  staticText: () => {
    return (
      <span>
        {"EFGH is a quadrilateral"}
        {comma}
        {EqualSegments.staticText(["LM", "NK"])}
        {comma}
        {RightAngle.staticText("KLM")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    givens.additions(props);
  },
  text: (props: StepTextProps) => EqualTriangles.text(props, ["KLM", "MNK"]),
  ticklessText: (ctx: Content) =>
    EqualTriangles.ticklessText(ctx, ["KLM", "MNK"]),
  staticText: () => EqualTriangles.staticText(["KLM", "MNK"]),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ["LK", "LM", "MN", "NK"].map((s) =>
      props.ctx.getSegment(s).mode(props.frame, props.mode)
    );
  },
  text: (props: StepTextProps) => {
    return (
      <span>
        {linked(
          "KLMN",
          new BaseGeometryObject(Obj.Quadrilateral, { hoverable: false }),
          [
            props.ctx.getSegment("LK"),
            props.ctx.getSegment("LM"),
            props.ctx.getSegment("MN"),
            props.ctx.getSegment("NK"),
          ]
        )}
        {" is a quadrilateral"}
      </span>
    );
  },
  staticText: () => <span>{"KLMN is a quadrilateral"}</span>,
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["LM", "NK"]);
  },
  text: (props: StepTextProps) => EqualSegments.text(props, ["LM", "NK"]),
  staticText: () => EqualSegments.staticText(["LM", "NK"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step2.additions({ ...props, mode: SVGModes.Unfocused });
    step2.unfocused(props);
  },
  additions: (props: StepFocusProps) => {
    RightAngle.additions(props, "KLM");
  },
  text: (props: StepTextProps) => RightAngle.text(props, "KLM"),
  staticText: () => RightAngle.staticText("KLM"),
});

const step4: StepMeta = makeStepMeta({
  reason: Reasons.Rectangle,
  dependsOn: [1],
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["KLM", "MNK"]);
  },
  text: (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["KLM", "MNK"]);
  },
  staticText: () => {
    return EqualRightAngles.staticText(["KLM", "MNK"]);
  },
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.Reflexive,
  unfocused: (props: StepUnfocusProps) => {
    step4.unfocused(props);
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Reflexive.additions(props, "MK", 2);
  },
  text: (props: StepTextProps) => Reflexive.text(props, "MK", 2),
  staticText: () => Reflexive.staticText("MK"),
});

const s6SASProps: SASProps = {
  seg1s: { s: ["LM", "KN"], ticks: 1 },
  seg2s: { s: ["MK", "MK"], ticks: 2 },
  angles: { a: ["KLM", "MNK"], type: Obj.RightTick },
  triangles: ["KLM", "MNK"],
};
const step6: StepMeta = makeStepMeta({
  reason: Reasons.HL,
  dependsOn: [2, 4, 5],
  additions: (props: StepFocusProps) => {
    SAS.additions(props, s6SASProps);
  },
  text: (props: StepTextProps) =>
    EqualTriangles.text(props, s6SASProps.triangles),
  staticText: () => EqualTriangles.staticText(s6SASProps.triangles),
});

export const miniContent = () => {
  let ctx = baseContent(false, false);

  const defaultStepProps: StepFocusProps = {
    ctx,
    frame: "",
    mode: SVGModes.Purple,
    inPlace: true,
  };

  const step4 = ctx.addFrame("s4");
  const rectangleSegs = ["LK", "LM", "MN", "NK"];
  rectangleSegs.map((s) => ctx.getSegment(s).mode(step4, SVGModes.Focused));
  const rectangleAngles = ["LMN", "NKL"];
  rectangleAngles.map((a) =>
    RightAngle.additions(
      { ...defaultStepProps, frame: step4, mode: SVGModes.Focused },
      a
    )
  );
  EqualRightAngles.additions(
    { ...defaultStepProps, frame: step4 },
    ["KLM", "MNK"],
    SVGModes.Blue
  );

  const step6 = ctx.addFrame("s6");
  SAS.additions(
    { ...defaultStepProps, frame: step6 },
    {
      seg1s: { s: ["LM", "NK"], ticks: 1 },
      seg2s: { s: ["MK", "MK"], ticks: 2 },
      angles: { a: ["KLM", "MNK"], type: Obj.RightTick },
      triangles: ["KLM", "MNK"],
    },
    SVGModes.Blue
  );
  return ctx;
};

export const PC3: LayoutProps = {
  questions: checkingProof3,
  baseContent,
  miniContent: miniContent(),
  steps: [step1, step2, step3, step4, step5, step6],
  givens,
  proves,
};
