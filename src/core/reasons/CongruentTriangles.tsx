import { Content } from "../diagramContent";
import { StepFocusProps } from "../types/stepTypes";
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

  static highlight = (
    ctx: Content,
    frame: string,
    labels: CongruentTrianglesProps
  ) => {
    EqualSegments.highlight(ctx, frame, labels.s1s, 1);
    EqualSegments.highlight(ctx, frame, labels.s2s, 2);
    EqualSegments.highlight(ctx, frame, labels.s3s, 3);
    EqualAngles.highlight(ctx, frame, labels.a1s, 1);
    EqualAngles.highlight(ctx, frame, labels.a2s, 2);
    EqualAngles.highlight(ctx, frame, labels.a3s, 3);
  };
  static highlightRightTriangle = (
    ctx: Content,
    frame: string,
    labels: CongruentTrianglesProps
  ) => {
    EqualSegments.highlight(ctx, frame, labels.s1s, 1);
    EqualSegments.highlight(ctx, frame, labels.s2s, 2);
    EqualSegments.highlight(ctx, frame, labels.s3s, 3);
    EqualAngles.highlight(ctx, frame, labels.a1s, 1);
    EqualAngles.highlight(ctx, frame, labels.a2s, 2);
    EqualAngles.highlight(ctx, frame, labels.a3s, 3);
  };
}
