import { definitions } from "../../theorems/definitions";
import { linked, tooltip } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { resizedStrs } from "../geometryText";
import {
  StepFocusProps,
  TickedAngles,
  TickedSegments,
} from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualAngles } from "./EqualAngles";
import { EqualRightAngles } from "./EqualRightAngles";
import { EqualSegments } from "./EqualSegments";

export interface ASAProps {
  a1s: TickedAngles;
  a2s: TickedAngles;
  segs: TickedSegments;
  triangles: [string, string];
}
export class ASA {
  static text = (ctx: Content, triangles: [string, string]) => {
    const [t1, t2] = triangles;
    return (
      <span>
        {linked(t1, ctx.getTriangle(t1))}
        {tooltip(resizedStrs.congruent, definitions.CongruentTriangles)}
        {linked(t2, ctx.getTriangle(t2))}
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
    EqualSegments.additions(
      props,
      labels.segs.s,
      labels.segs.ticks || 1,
      t2Mode
    );
    [labels.a1s, labels.a2s].forEach((a, i) => {
      if (a.type === Obj.RightTick) {
        EqualRightAngles.additions(props, a.a, t2Mode);
      } else {
        EqualAngles.additions(props, a.a, a.ticks || 1, t2Mode);
      }
    });
  };
}
