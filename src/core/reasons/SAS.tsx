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

export interface SASProps {
  seg1s: TickedSegments;
  seg2s: TickedSegments;
  angles: TickedAngles;
  triangles: [string, string];
}
export class SAS {
  static additions = (props: StepFocusProps, labels: SASProps) => {
    EqualTriangles.additions(props, labels.triangles);
    EqualSegments.additions(props, labels.seg1s.s, labels.seg1s.ticks);
    EqualSegments.additions(props, labels.seg2s.s, labels.seg2s.ticks);
    if (labels.angles.type === Obj.RightTick) {
      EqualRightAngles.additions(props, labels.angles.a);
    } else {
      EqualAngles.additions(props, labels.angles.a, labels.angles.ticks || 1);
    }
  };
  static highlight = (
    props: StepProps,
    labels: SASProps,
    mode: SVGModes = SVGModes.ReliesOn
  ) => {
    EqualSegments.highlight(props, labels.seg1s.s, mode);
    EqualSegments.highlight(props, labels.seg2s.s, mode, 2);
    if (labels.angles.type === Obj.RightTick) {
      EqualRightAngles.highlight(props, labels.angles.a, mode);
    } else {
      EqualAngles.highlight(props, labels.angles.a, mode);
    }
  };
}
