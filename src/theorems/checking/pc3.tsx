import { Angle } from "../../core/geometry/Angle";
import { BaseGeometryObject } from "../../core/geometry/BaseGeometryObject";
import { Point } from "../../core/geometry/Point";
import { Triangle } from "../../core/geometry/Triangle";
import { angleStr, comma, strs, triangleStr } from "../../core/geometryText";
import { Content } from "../../core/objgraph";
import { Obj, SVGModes, Vector } from "../../core/types";
import { Reasons } from "../reasons";
import { EqualRightAngles } from "../templates/EqualRightAngles";
import { EqualSegments } from "../templates/EqualSegments";
import { EqualTriangles } from "../templates/EqualTriangles";
import { Reflexive } from "../templates/Reflexive";
import { RightAngle } from "../templates/RightAngle";
import { SAS, SASProps } from "../templates/SAS";
import {
  LayoutProps,
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
  linked,
  makeStepMeta,
} from "../utils";

export const baseContent = (labeledPoints: boolean, parentFrame?: string) => {
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
        parentFrame: parentFrame,
      })
    );
  });
  ctx.push(new Triangle({ pts: [L, M, K], parentFrame }, ctx));
  ctx.push(new Triangle({ pts: [K, N, M], parentFrame }, ctx));

  // for mini figures
  ctx.push(new Angle({ start: L, center: M, end: N }));
  ctx.push(new Angle({ start: L, center: K, end: N }));
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
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          LK,
          LM,
          MN,
          NK,
        ])}
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
        {linked("EFGH", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          LK,
          LM,
          MN,
          NK,
        ])}
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
  text: (props: StepTextProps) => EqualTriangles.text(props, ["LMK", "KMN"]),
  ticklessText: (ctx: Content) =>
    EqualTriangles.ticklessText(ctx, ["LMK", "KMN"]),
  staticText: () => EqualTriangles.staticText(["LMK", "KMN"]),
});

const step1: StepMeta = makeStepMeta({
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
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          props.ctx.getSegment("LK"),
          props.ctx.getSegment("LM"),
          props.ctx.getSegment("MN"),
          props.ctx.getSegment("NK"),
        ])}
        {" is a quadrilateral"}
      </span>
    );
  },
  ticklessText: (ctx: Content) => {
    return (
      <span>
        {linked("KLMN", new BaseGeometryObject(Obj.Quadrilateral, {}), [
          ctx.getSegment("LK"),
          ctx.getSegment("LM"),
          ctx.getSegment("MN"),
          ctx.getSegment("NK"),
        ])}
        {" is a quadrilateral"}
      </span>
    );
  },
  staticText: () => <span>{"KLMN is a quadrilateral"}</span>,
});

const step2: StepMeta = makeStepMeta({
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
  unfocused: (props: StepUnfocusProps) => {
    step3.unfocused(props);
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["KLM", "MNK"]);
  },
  text: (props: StepTextProps) => {
    const MNK = props.ctx.getAngle("MNK");
    return (
      <span>
        {RightAngle.text(props, "KLM")}
        {" = "}
        {linked("MNK", MNK, [
          props.ctx.getTick(MNK, Obj.RightTick, { frame: props.frame }),
        ])}
      </span>
    );
  },
  staticText: () => {
    return (
      <span>
        {angleStr("KLM")}
        {" = "}
        {angleStr("MNK")}
      </span>
    );
  },
});

const step5: StepMeta = makeStepMeta({
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
  seg1s: ["LM", "KN"],
  seg2s: ["MK", "MK"],
  angles: ["KLM", "MNK"],
  triangles: ["KLM", "MNK"],
  tickOverride: Obj.RightTick,
};
const step6: StepMeta = makeStepMeta({
  additions: (props: StepFocusProps) => {
    SAS.additions(props, s6SASProps);
  },
  text: (props: StepTextProps) => {
    return SAS.text(props, s6SASProps);
  },
  staticText: () => EqualTriangles.staticText(s6SASProps.triangles),
});

export const miniContent = () => {
  let ctx = baseContent(false);

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
      seg1s: ["LM", "NK"],
      seg2s: ["MK", "MK"],
      angles: ["KLM", "MNK"],
      triangles: ["KLM", "MNK"],
      tickOverride: Obj.RightTick,
    },
    SVGModes.Blue
  );
  return ctx;
};

// TODO part of long-form, deprecate
// export const reliesOnText = () => {
//   let relies = new Map<string, string[]>();
//   const s1 = `(1) KLMN is a quadrilateral`;
//   const s2 = `(2) LM ${strs.congruent} MK`;
//   const s4 = `(4) MK ${strs.congruent} MK`;
//   const s5 = `(5) ${strs.angle}KLM ${strs.right} = ${strs.angle}MNK`;
//   relies.set("s4", [s1]);
//   relies.set("s6", [s2, s4, s5]);
//   return relies;
// };

export const PC3: LayoutProps = {
  baseContent,
  // reliesOnText: reliesOnText(), // TODO remove
  miniContent: miniContent(),
  steps: [
    { meta: step1, reason: Reasons.Given },
    { meta: step2, reason: Reasons.Given },
    { meta: step3, reason: Reasons.Given },
    { meta: step4, reason: Reasons.Rectangle, dependsOn: [1] },
    { meta: step5, reason: Reasons.Reflexive },
    { meta: step6, reason: Reasons.HL, dependsOn: [2, 4, 5] },
  ],
  givens,
  proves,
};
