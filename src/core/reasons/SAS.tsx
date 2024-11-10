import {
  StepFocusProps,
  TickedAngles,
  TickedSegments,
} from "../types/stepTypes";
import { Obj } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";

export interface SASProps {
  seg1s: TickedSegments;
  seg2s: TickedSegments;
  angles: TickedAngles;
  triangles: [string, string];
}
export class SAS {
  static additions = (props: StepFocusProps, labels: SASProps) => {
    const t1 = props.ctx
      .getTriangle(labels.triangles[0])
      .mode(props.frame, props.mode);
    const t2 = props.ctx
      .getTriangle(labels.triangles[1])
      .mode(props.frame, props.mode2 || props.mode);
    EqualSegments.additions(props, labels.seg1s.s, labels.seg1s.ticks);
    EqualSegments.additions(props, labels.seg2s.s, labels.seg2s.ticks);
    if (labels.angles.type === Obj.RightTick) {
      EqualRightAngles.additions(props, labels.angles.a);
    } else {
      EqualAngles.additions(props, labels.angles.a, labels.angles.ticks || 1);
    }
  };
}
