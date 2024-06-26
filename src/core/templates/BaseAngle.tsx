import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { BaseGeometryObject } from "../geometry/BaseGeometryObject";
import { Tick } from "../geometry/Tick";
import { angleStr } from "../geometryText";

export class BaseAngle {
  static text = (ctx: Content, a: string, ticks?: Tick[]) => {
    const ang = ctx.getAngle(a);
    // add segments to highlight on hover list.
    // If angle is named XYZ, segments will be XY and YZ.
    let deps: BaseGeometryObject[] = [
      ctx.getSegment(a.substring(0, 2)),
      ctx.getSegment(a.substring(1, 3)),
    ];
    if (ticks) {
      deps = deps.concat(ticks);
    }
    return linked(a, ang, deps);
  };
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
