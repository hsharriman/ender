import { Content } from "../diagramContent";
import {
  StepFocusProps,
  StepProps,
  TickedAngles,
  TickedSegments,
} from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
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
    return EqualTriangles.text(triangles);
  };

  static additions = (props: StepFocusProps, labels: ASAProps) => {
    EqualTriangles.additions(props, labels.triangles);
    // props.ctx.getTriangle(labels.triangles[0]).mode(props.frame, props.mode);
    // props.ctx.getTriangle(labels.triangles[1]).mode(props.frame, props.mode);
    EqualSegments.additions(props, labels.segs.s, labels.segs.ticks || 1);
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.type === Obj.RightTick) {
        EqualRightAngles.additions(props, a.a);
      } else {
        EqualAngles.additions(props, a.a, a.ticks || 1);
      }
    });
  };
  static highlight = (
    props: StepProps,
    labels: ASAProps,
    mode: SVGModes = SVGModes.ReliesOn
  ) => {
    EqualSegments.highlight(props, labels.segs.s, mode, labels.segs.ticks || 1);
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.type === Obj.RightTick) {
        EqualRightAngles.highlight(props, a.a, mode);
      } else {
        EqualAngles.highlight(props, a.a, mode, a.ticks || 1);
      }
    });
  };
}
