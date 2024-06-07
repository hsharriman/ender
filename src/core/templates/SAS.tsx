import { linked } from "../../theorems/utils";
import { congruent } from "../geometryText";
import { tooltip } from "../../theorems/utils";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes, TickType } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";
import { strs } from "../geometryText";
import { definitions } from "../../theorems/definitions";

export interface SASProps {
  seg1s: [string, string];
  seg2s: [string, string];
  angles: [string, string];
  triangles: [string, string];
  tickOverride?: TickType;
}
export class SAS {
  static text = (props: StepTextProps, labels: SASProps) => {
    const [t1s1, t2s1] = labels.seg1s;
    const [t1s2, t2s2] = labels.seg2s;
    const [t1a, t2a] = labels.angles;
    const [t1, t2] = labels.triangles;
    const options = { frame: props.frame };
    return (
      <span>
        {linked(t1, props.ctx.getTriangle(t1), [
          props.ctx.getTick(
            props.ctx.getSegment(t1s1),
            Obj.EqualLengthTick,
            options
          ),
          props.ctx.getTick(props.ctx.getSegment(t1s2), Obj.EqualLengthTick, {
            ...options,
            num: 2,
          }),
          props.ctx.getTick(
            props.ctx.getAngle(t1a),
            labels.tickOverride || Obj.EqualAngleTick,
            options
          ),
        ])}
        {tooltip(
          strs.congruent,
          definitions.CongruentTriangles.keyword,
          definitions.CongruentTriangles.definition
        )}
        {linked(t2, props.ctx.getTriangle(t2), [
          props.ctx.getTick(
            props.ctx.getSegment(t2s1),
            Obj.EqualLengthTick,
            options
          ),
          props.ctx.getTick(props.ctx.getSegment(t2s2), Obj.EqualLengthTick, {
            ...options,
            num: 2,
          }),
          props.ctx.getTick(
            props.ctx.getAngle(t2a),
            labels.tickOverride || Obj.EqualAngleTick,
            options
          ),
        ])}
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
    EqualSegments.additions(props, labels.seg1s, 1, t2Mode);
    EqualSegments.additions(props, labels.seg2s, 2, t2Mode);
    if (labels.tickOverride === Obj.RightTick) {
      EqualRightAngles.additions(props, labels.angles, t2Mode);
    } else {
      EqualAngles.additions(props, labels.angles, 1, t2Mode);
    }
  };
}
