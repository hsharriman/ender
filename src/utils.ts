import { Obj } from "./core/types";

export const getId = (objectType: Obj, label: string, tickNumber?: number) => {
  if (objectType === Obj.Angle || objectType === Obj.EqualAngleTick) {
    const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
    label = `${label[1]}-${endPts}`;
  } else {
    label = Array.from(label).sort().toString().replaceAll(",", "");
  }
  let id = `${objectType}.${label}`;
  return tickNumber ? `${id}.${tickNumber}` : id;
};
