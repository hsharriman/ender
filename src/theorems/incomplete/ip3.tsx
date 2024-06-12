import { Content } from "../../core/diagramContent";
import { makeStepMeta } from "../utils";
import { comma } from "../../core/geometryText";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { Midpoint } from "../../core/templates/Midpoint";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../../core/types/stepTypes";
import { LayoutProps, Obj, SVGModes, Vector } from "../../core/types/types";
import { Reasons } from "../reasons";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { VerticalAngles } from "../../core/templates/VerticalAngles";
import { EqualTriangles } from "../../core/templates/EqualTriangles";
import { ASAAngleMeta, ASAProps, ASA } from "../../core/templates/ASA";

const givens: StepMeta = makeStepMeta({
  // TODO: looks like equalrightangles doesn't have tickless text?
  text: (props: StepTextProps) => {
    const PeqM = EqualRightAngles.text(props, ["P", "M"]);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.text(props, "PM", ["PR", "MR"], "R")}
      </span>
    );
  },

  ticklessText: (ctx: Content) => {
    const PeqM = EqualRightAngles.ticklesstText(ctx, ["P", "M"]);

    return (
      <span>
        {PeqM}
        {comma}
        {Midpoint.ticklessText(ctx, "PM", ["PR", "MR"], "R")}
      </span>
    );
  },

  additions: (props: StepFocusProps) => {
    props.ctx.getTriangle("QRP").mode(props.frame, props.mode);
    props.ctx.getTriangle("MRN").mode(props.frame, props.mode);
  },

  diagram: (ctx: Content, frame: string) => {
    givens.additions({ ctx, frame, mode: SVGModes.Default, inPlace: true });
  },
  staticText: () => {
    return (
      <span>
        {EqualRightAngles.staticText(["P", "M"])}
        {comma}
        {Midpoint.staticText("R", "PM")}
      </span>
    );
  },
});

const proves: StepMeta = makeStepMeta({
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    Midpoint.additions(props, "R", ["QR", "NR"]);
  },
  text: (props: StepTextProps) => {
    return Midpoint.text(props, "QN", ["QR", "NR"], "R");
  },
  staticText: () => Midpoint.staticText("R", "QN"),
});

const step1: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    givens.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualRightAngles.additions(props, ["P", "M"]);
  },
  text: (props: StepTextProps) => {
    return EqualRightAngles.text(props, ["P", "M"]);
  },
  staticText: () => EqualRightAngles.staticText(["P", "M"]),
});

const step2: StepMeta = makeStepMeta({
  reason: Reasons.Given,
  unfocused: (props: StepUnfocusProps) => {
    step1.unfocused(props);
    step1.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["PR", "RM"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["PR", "RM"]);
  },
  staticText: () => EqualSegments.staticText(["PR", "RM"]),
});

const step3: StepMeta = makeStepMeta({
  reason: Reasons.VerticalAngles,
  unfocused: (props: StepUnfocusProps) => {
    step2.unfocused(props);
    step2.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualAngles.additions(props, ["QRP", "MRN"]);
  },
  text: (props: StepTextProps) => EqualAngles.text(props, ["QRP", "MRN"]),
  staticText: () => EqualAngles.staticText(["QRP", "MRN"]),
});

const step4ASAAngleMeta1: ASAAngleMeta = {
  angles: ["QRP", "MRN"],
  tick: Obj.EqualAngleTick,
};
const step4ASAAngleMeta2: ASAAngleMeta = {
  angles: ["QPR", "RMN"],
  tick: Obj.RightTick,
};
const step4SASProps: ASAProps = {
  a1s: step4ASAAngleMeta1,
  a2s: step4ASAAngleMeta2,
  segs: ["PR", "RM"],
  triangles: ["QRP", "MRN"],
};
const step4: StepMeta = makeStepMeta({
  reason: Reasons.ASA,
  dependsOn: [1, 2, 3],
  unfocused: (props: StepUnfocusProps) => {
    step3.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    ASA.additions(props, step4SASProps);
  },
  text: (props: StepTextProps) => ASA.text(props, step4SASProps),
  staticText: () => EqualTriangles.staticText(["QRP", "MRN"]),
});

const step5: StepMeta = makeStepMeta({
  reason: Reasons.CorrespondingSegments,
  dependsOn: [4],
  unfocused: (props: StepUnfocusProps) => {
    step4.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => {
    EqualSegments.additions(props, ["QR", "RN"]);
  },
  text: (props: StepTextProps) => {
    return EqualSegments.text(props, ["QR", "RN"]);
  },
  staticText: () => EqualSegments.staticText(["QR", "RN"]),
});

const step6: StepMeta = makeStepMeta({
  reason: Reasons.Midpoint,
  dependsOn: [5],
  unfocused: (props: StepUnfocusProps) => {
    step5.unfocused(props);
    step5.additions({ ...props, mode: SVGModes.Unfocused });
  },
  additions: (props: StepFocusProps) => step6.additions(props),
  text: (props: StepTextProps) =>
    Midpoint.text(props, "AC", ["AD", "DC"], "D", 2),
  staticText: () => Midpoint.staticText("D", "AC"),
});
