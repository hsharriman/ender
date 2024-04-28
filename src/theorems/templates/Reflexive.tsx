import { congruent } from "../../core/geometryText";
import { Obj } from "../../core/types";
import { StepFocusProps, StepTextProps, linked } from "../utils";
import { EqualSegments } from "./EqualSegments";

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
        {congruent}
        {MKLinked}
      </span>
    );
  };
  static staticText = (s: string) => {
    return EqualSegments.staticText([s, s]);
  };
}
