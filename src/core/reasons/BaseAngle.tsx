import { BGColors, chipText } from "../../theorems/utils";
import { angleStr } from "../geometryText";
import { Obj } from "../types/types";

export class BaseAngle {
  static text = (a: string, clr: BGColors) => (isActive: boolean) => {
    return chipText(Obj.Angle, a, clr, isActive);
  };
  static staticText = (a: string) => {
    return angleStr(a);
  };
}
