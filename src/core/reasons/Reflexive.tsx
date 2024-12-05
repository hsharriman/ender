import { Content } from "../diagramContent";
import { StepFocusProps } from "../types/stepTypes";
import { Obj, SVGModes } from "../types/types";
import { EqualSegments } from "./EqualSegments";

export class Reflexive {
  static additions = (props: StepFocusProps, s: string, num = 1) => {
    props.ctx
      .getSegment(s)
      .addTick(props.frame, Obj.EqualLengthTick, num)
      .mode(props.frame, props.mode);
  };
  static text = (s: string) => (isActive: boolean) => {
    return this.staticText(s);
  };
  static staticText = (s: string) => {
    return EqualSegments.staticText([s, s]);
  };
  static highlight = (
    ctx: Content,
    frame: string,
    s: string,
    mode: SVGModes,
    num = 1
  ) => {
    return EqualSegments.highlight(ctx, frame, [s, s], mode, num);
  };
}
