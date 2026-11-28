import { Obj } from "geometry-object";
import { angleStr, circleStr } from "../geometryText";
import { StepFocusProps } from "../types/stepTypes";

export class InscribedAngle {
  static additions = (props: StepFocusProps, c: string, a: string) => {
    // The arc, not the whole circle, is highlighted: a highlighted circle
    // would draw over it.
    const circle = props.ctx.getCircle(c);
    props.ctx
      .getAngle(a)
      ?.addTick(props.frame, Obj.AngleHighlight)
      .mode(props.frame, props.mode);
    // The arc the angle cuts off, on the far side of the circle from its
    // vertex.
    const [start, vertex, end] = [...a].map((p) => props.ctx.getPoint(p));
    if (!circle || !start || !vertex || !end) return;
    props.ctx
      .addArc({ center: circle.center, start, end, opposite: vertex })
      .mode(props.frame, props.mode);
  };
  static text = (c: string, a: string) => (isActive: boolean) => {
    return (
      <span>
        {angleStr(a)}
        {" inscribes "}
        {circleStr(c)}
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
