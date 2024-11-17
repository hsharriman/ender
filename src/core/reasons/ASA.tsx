import { Content } from "../diagramContent";
import {
  StepFocusProps,
  TickedAngles,
  TickedSegments,
} from "../types/stepTypes";
import { Obj } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";
import { EqualTriangles } from "./EqualTriangles";

export interface ASAProps {
  a1s: TickedAngles;
  a2s: TickedAngles;
  segs: TickedSegments;
  triangles: [string, string];
}
export class ASA {
  static text = (ctx: Content, triangles: [string, string]) => {
    return EqualTriangles.staticText(triangles);
  };

  static additions = (props: StepFocusProps, labels: ASAProps) => {
    props.ctx.getTriangle(labels.triangles[0]).mode(props.frame, props.mode);
    props.ctx.getTriangle(labels.triangles[1]).mode(props.frame, props.mode);
    EqualSegments.additions(props, labels.segs.s, labels.segs.ticks || 1);
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.type === Obj.RightTick) {
        EqualRightAngles.additions(props, a.a);
      } else {
        EqualAngles.additions(props, a.a, a.ticks || 1);
      }
    });
  };
  static highlight = (ctx: Content, frame: string, labels: ASAProps) => {
    EqualSegments.highlight(ctx, frame, labels.segs.s, labels.segs.ticks || 1);
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.type === Obj.RightTick) {
        EqualRightAngles.highlight(ctx, frame, a.a);
      } else {
        EqualAngles.highlight(ctx, frame, a.a, a.ticks || 1);
      }
    });
  };
}
