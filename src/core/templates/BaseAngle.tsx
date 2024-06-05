import { linked } from "../../theorems/utils";
import { Content } from "../diagramContent";
import { BaseGeometryObject } from "../geometry/BaseGeometryObject";
import { Tick } from "../geometry/Tick";
import { angleStr } from "../geometryText";
import { StepTextProps } from "../types/stepTypes";

export class BaseAngle {
  static text = (props: StepTextProps, a: string, ticks?: Tick[]) => {
    const ang = props.ctx.getAngle(a);
    const [a1s1, a1s2] = [`${a[0]}${a[1]}`, `${a[1]}${a[2]}`];
    let deps: BaseGeometryObject[] = [
      props.ctx.getSegment(a1s1),
      props.ctx.getSegment(a1s2),
    ];
    if (ticks) {
      deps = deps.concat(ticks);
    }
    return linked(a, ang, deps);
  };
  static ticklessText = (ctx: Content, a: string) => {
    const [a1s1, a1s2] = [`${a[0]}${a[1]}`, `${a[1]}${a[2]}`];
    return linked(a, ctx.getAngle(a), [
      ctx.getSegment(a1s1),
      ctx.getSegment(a1s2),
    ]);
  };
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
