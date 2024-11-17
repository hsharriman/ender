import { Content } from "../diagramContent";
import { StepFocusProps } from "../types/stepTypes";
import { EqualSegments } from "./EqualSegments";

export interface SSSProps {
  s1s: [string, string];
  s2s: [string, string];
  s3s: [string, string];
}
export class SSS {
  static additions = (props: StepFocusProps, labels: SSSProps) => {
    EqualSegments.additions(props, labels.s1s);
    EqualSegments.additions(props, labels.s2s, 2);
    EqualSegments.additions(props, labels.s3s, 3);
  };
  static highlight = (ctx: Content, frame: string, labels: SSSProps) => {
    EqualSegments.highlight(ctx, frame, labels.s1s);
    EqualSegments.highlight(ctx, frame, labels.s2s, 2);
    EqualSegments.highlight(ctx, frame, labels.s3s, 3);
  };
}
