import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { BaseGeometryObject } from "../geometry/BaseGeometryObject";
import { Tick } from "../geometry/Tick";
import { angleStr } from "../geometryText";
import { StepTextProps } from "../types/stepTypes";

export class BaseAngle {
  static text = (props: StepTextProps, a: string, ticks?: Tick[]) => {
    const ang = props.ctx.getAngle(a);
    // add segments to highlight on hover list.
    // If angle is named XYZ, segments will be XY and YZ.
    let deps: BaseGeometryObject[] = [
      props.ctx.getSegment(a.substring(0, 2)),
      props.ctx.getSegment(a.substring(1, 3)),
    ];
    if (ticks) {
      deps = deps.concat(ticks);
    }
    return linked(a, ang, deps);
  };
  static ticklessText = (ctx: Content, a: string) =>
    linked(a, ctx.getAngle(a), [
      ctx.getSegment(a.substring(0, 2)),
      ctx.getSegment(a.substring(1, 3)),
    ]);
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
