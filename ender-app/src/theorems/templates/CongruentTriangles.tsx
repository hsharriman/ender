import { Content } from "../../core/objgraph";
import { SVGModes } from "../../core/types";
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
    ctx: Content,
    frame: string,
    labels: CongruentTrianglesProps,
    t1Mode: SVGModes,
    t2Mode: SVGModes,
    inPlace = true
  ) => {
    EqualSegments.additions(ctx, labels.s1s, frame, t1Mode, t2Mode, inPlace, 1);
    EqualSegments.additions(ctx, labels.s2s, frame, t1Mode, t2Mode, inPlace, 2);
    EqualSegments.additions(ctx, labels.s3s, frame, t1Mode, t2Mode, inPlace, 3);
    EqualAngles.additions(ctx, labels.a1s, frame, t1Mode, t2Mode, inPlace, 1);
    EqualAngles.additions(ctx, labels.a2s, frame, t1Mode, t2Mode, inPlace, 2);
    EqualAngles.additions(ctx, labels.a3s, frame, t1Mode, t2Mode, inPlace, 3);
    return ctx;
  };
}
