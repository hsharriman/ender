import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { resizedStrs } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj, SVGModes, TickType } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";

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
  static text = (props: StepTextProps, triangles: [string, string]) => {
    const [t1, t2] = triangles;
    return (
      <span>
        {linked(t1, props.ctx.getTriangle(t1))}
        {tooltip(resizedStrs.congruent, definitions.CongruentTriangles)}
        {linked(t2, props.ctx.getTriangle(t2))}
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
