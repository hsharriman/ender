import { angleStr, segmentStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class InscribedAngle {
  static additions = (props: StepFocusProps, s: string, a: string) => {
    props.ctx.getSegment(s)?.mode(props.frame, props.mode);
    props.ctx.getAngle(a)?.mode(props.frame, props.mode);
  };
  static text = (s: string, a: string) => (isActive: boolean) => {
    return (
      <span>
        {angleStr(a)}
        {" inscribes "}
        {segmentStr(s, isActive)}
      </span>
    );
  };
  // static highlight = (
  //   props: StepProps,
  //   [a1, a2]: [string, string],
  //   mode: SVGModes,
  //   num: number = 1,
  // ) => {
  //   const { ctx, frame } = props;
  //   ctx.getAngle(a1)?.addTick(frame, Obj.EqualAngleTick, num).mode(frame, mode);
  //   ctx.getAngle(a2)?.addTick(frame, Obj.EqualAngleTick, num).mode(frame, mode);
  // };
}
