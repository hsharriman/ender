import { BGColors } from "../../theorems/utils";
import { angleStr } from "../geometryText";

export class BaseAngle {
  static text = (a: string, clr: BGColors) => (isActive: boolean) => {
    // return chipText(Obj.Angle, a, clr, isActive);
    return angleStr(a);
  };
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
