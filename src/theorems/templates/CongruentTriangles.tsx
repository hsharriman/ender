import { SVGModes } from "../../core/types";
import { StepFocusProps } from "../utils";
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
    labels: CongruentTrianglesProps,
    t2Mode?: SVGModes
  ) => {
    EqualSegments.additions(props, labels.s1s, 1, t2Mode);
    EqualSegments.additions(props, labels.s2s, 2, t2Mode);
    EqualSegments.additions(props, labels.s3s, 3, t2Mode);
    EqualAngles.additions(props, labels.a1s, 1, t2Mode);
    EqualAngles.additions(props, labels.a2s, 2, t2Mode);
    EqualAngles.additions(props, labels.a3s, 3, t2Mode);
  };
}
