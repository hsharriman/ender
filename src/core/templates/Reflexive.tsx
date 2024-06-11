import { linked } from "../../theorems/utils";
import { tooltip } from "../../theorems/utils";
import { congruent } from "../geometryText";
import { StepFocusProps, StepTextProps } from "../types/stepTypes";
import { Obj } from "../types/types";
import { EqualSegments } from "./EqualSegments";
import { strs } from "../geometryText";
import { definitions } from "../../theorems/definitions";

export class Reflexive {
  static additions = (props: StepFocusProps, s: string, num = 1) => {
    const options = props.inPlace ? { num } : { frame: props.frame, num };
    const seg = props.ctx.getSegment(s).mode(props.frame, props.mode);
    props.ctx
      .pushTick(seg, Obj.EqualLengthTick, options)
      .mode(props.frame, props.mode);
  };
  static text = (props: StepTextProps, s: string, num = 1) => {
    const seg = props.ctx.getSegment(s);
    const MKLinked = linked(s, seg, [
      props.ctx.getTick(seg, Obj.EqualLengthTick, { frame: props.frame, num }),
    ]);
    return (
      <span>
        {MKLinked}
        {tooltip(strs.congruent, definitions.CongruentAngles)}
        {MKLinked}
      </span>
    );
  };
  static staticText = (s: string) => {
    return EqualSegments.staticText([s, s]);
  };
}
