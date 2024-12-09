import { StepFocusProps, StepProps } from "../types/stepTypes";
import { SVGModes } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualSegments } from "./EqualSegments";

interface CongruentTrianglesProps {
  s1s: [string, string];
  s2s: [string, string];
  s3s: [string, string];
  a1s: [string, string];
  a2s: [string, string];
  a3s: [string, string];
}

export class CongruentTriangles {
  static additions = (
    props: StepFocusProps,
    labels: CongruentTrianglesProps
  ) => {
    EqualSegments.additions(props, labels.s1s, 1);
    EqualSegments.additions(props, labels.s2s, 2);
    EqualSegments.additions(props, labels.s3s, 3);
    EqualAngles.additions(props, labels.a1s, 1);
    EqualAngles.additions(props, labels.a2s, 2);
    EqualAngles.additions(props, labels.a3s, 3);
  };

  static congruentLabel = (
    props: StepProps,
    labels: [string, string],
    mode: SVGModes
  ) => {
    const { ctx, frame } = props;
    ctx.getTriangle(labels[0]).setCongruent(frame).labelMode(frame, mode);
    ctx.getTriangle(labels[1]).setCongruent(frame).labelMode(frame, mode);
  };
}
