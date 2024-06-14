import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { strs } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes, TickType } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";

interface TickedSegments {
  s: [string, string];
  ticks: number;
}
interface TickedAngles {
  a: [string, string];
  ticks?: number;
  type?: TickType;
}

const segmentTick = (ctx: Content, seg: TickedSegments, frame?: string) => {
  return seg.s.map((s) =>
    ctx.getTick(ctx.getSegment(s), Obj.EqualLengthTick, {
      frame,
      num: seg.ticks,
    })
  );
};
const angleTick = (ctx: Content, angle: TickedAngles, frame?: string) => {
  return angle.a.map((a) =>
    ctx.getTick(ctx.getAngle(a), angle.type || Obj.EqualAngleTick, {
      frame,
      num: angle.ticks,
    })
  );
};
export interface SASProps {
  seg1s: TickedSegments;
  seg2s: TickedSegments;
  angles: TickedAngles;
  triangles: [string, string];
}
export class SAS {
  static text = (props: StepTextProps, labels: SASProps) => {
    const s1s = segmentTick(props.ctx, labels.seg1s, props.frame);
    const s2s = segmentTick(props.ctx, labels.seg2s, props.frame);
    const as = angleTick(props.ctx, labels.angles, props.frame);
    const [t1, t2] = labels.triangles;
    return (
      <span>
        {linked(t1, props.ctx.getTriangle(t1), [s1s[0], s2s[0], as[0]])}
        {tooltip(strs.congruent, definitions.CongruentTriangles)}
        {linked(t2, props.ctx.getTriangle(t2), [s1s[1], s2s[1], as[1]])}
      </span>
    );
  };

  static additions = (
    props: StepFocusProps,
    labels: SASProps,
    t2Mode?: SVGModes
  ) => {
    props.ctx.getTriangle(labels.triangles[0]).mode(props.frame, props.mode);
    props.ctx
      .getTriangle(labels.triangles[1])
      .mode(props.frame, t2Mode || props.mode);
    EqualSegments.additions(props, labels.seg1s.s, labels.seg1s.ticks, t2Mode);
    EqualSegments.additions(props, labels.seg2s.s, labels.seg2s.ticks, t2Mode);
    if (labels.angles.type === Obj.RightTick) {
      EqualRightAngles.additions(props, labels.angles.a, t2Mode);
    } else {
      EqualAngles.additions(
        props,
        labels.angles.a,
        labels.angles.ticks || 1,
        t2Mode
      );
    }
  };
}
