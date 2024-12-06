import { angleStr } from "../geometryText";

export class BaseAngle {
  static text = (a: string, clr: string) => (isActive: boolean) => {
    // return chipText(Obj.Angle, a, clr, isActive);
    return angleStr(a);
  };
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
