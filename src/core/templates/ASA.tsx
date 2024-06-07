import { linked } from "../../theorems/utils";
import { tooltip } from "../../theorems/utils";
import { congruent } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes, TickType } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";
import { definitions } from "../../theorems/definitions";
import { strs } from "../geometryText";

export interface ASAAngleMeta {
  angles: [string, string];
  tick: TickType;
  numTicks?: number;
}
export interface ASAProps {
  a1s: ASAAngleMeta;
  a2s: ASAAngleMeta;
  segs: [string, string];
  triangles: [string, string];
  segTickType?: TickType;
  segTickNum?: number;
}
export class ASA {
  static text = (props: StepTextProps, meta: ASAProps) => {
    const [t1s, t2s] = meta.segs;
    const [t1, t2] = meta.triangles;
    const [t1a1, t2a1] = meta.a1s.angles;
    const a1tick = meta.a1s.tick;
    const a2tick = meta.a2s.tick;
    const [t1a2, t2a2] = meta.a2s.angles;
    const options = { frame: props.frame };

    return (
      <span>
        {linked(t1, props.ctx.getTriangle(t1), [
          props.ctx.getTick(
            props.ctx.getSegment(t1s),
            meta.segTickType || Obj.EqualLengthTick,
            { ...options, num: meta.segTickNum }
          ),
          props.ctx.getTick(props.ctx.getAngle(t1a1), a1tick, {
            ...options,
            num: meta.a1s.numTicks,
          }),
          props.ctx.getTick(props.ctx.getAngle(t1a2), a2tick, {
            ...options,
            num: meta.a2s.numTicks,
          }),
        ])}
        {tooltip(
          strs.congruent,
          definitions.CongruentTriangles.keyword,
          definitions.CongruentTriangles.keyword
        )}
        {linked(t2, props.ctx.getTriangle(t2), [
          props.ctx.getTick(
            props.ctx.getSegment(t2s),
            meta.segTickType || Obj.EqualLengthTick,
            { ...options, num: meta.segTickNum }
          ),
          props.ctx.getTick(props.ctx.getAngle(t2a1), a1tick, {
            ...options,
            num: meta.a1s.numTicks,
          }),
          props.ctx.getTick(props.ctx.getAngle(t2a2), a2tick, {
            ...options,
            num: meta.a2s.numTicks,
          }),
        ])}
      </span>
    );
  };

  static additions = (
    props: StepFocusProps,
    labels: ASAProps,
    t2Mode?: SVGModes
  ) => {
    props.ctx.getTriangle(labels.triangles[0]).mode(props.frame, props.mode);
    props.ctx
      .getTriangle(labels.triangles[1])
      .mode(props.frame, t2Mode || props.mode);
    EqualSegments.additions(props, labels.segs, labels.segTickNum || 1, t2Mode);
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.tick === Obj.RightTick) {
        EqualRightAngles.additions(props, a.angles, t2Mode);
      } else {
        EqualAngles.additions(props, a.angles, a.numTicks || 1, t2Mode);
      }
    });
  };
}
