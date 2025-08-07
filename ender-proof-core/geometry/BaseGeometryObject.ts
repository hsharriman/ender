import { BaseGeometryProps } from "../types/geometryTypes";
import { Obj, SVGModes } from "../types/types";

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: string[] = [];
  public label: string = "";
  protected modes: Map<string, SVGModes>;
  public activeIdx: number;
  // readonly hoverable: boolean;

  constructor(tag: Obj, props: BaseGeometryProps) {
    this.tag = tag;
    this.modes = new Map<string, SVGModes>();
    this.activeIdx = props.activeIdx ? props.activeIdx : -1;
    // this.hoverable = props.hoverable;
  }

  // https://stackoverflow.com/questions/9960908/permutations-in-javascript
  protected permutator = (inputArr: string[]): string[] => {
    let result: string[] = [];
    const permute = (arr: string[], m: string = "") => {
      if (arr.length === 0) {
        result.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice(); // copy arr
          let next = curr.splice(i, 1);
          permute(curr.slice(), m + next);
        }
      }
    };
    permute(inputArr);
    return result;
  };

  protected getId = (objectType: Obj, label: string, tickNumber?: number) => {
    if (objectType === Obj.Angle || objectType === Obj.EqualAngleTick) {
      const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
      label = `${label[1]}-${endPts}`;
    } else {
      label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  };

  getMode = (frameKey: string) => this.modes.get(frameKey);

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  // deprecated
  onClickText = (isActive: boolean) => {
    // do nothing
  };

  isEqualTo = (other: BaseGeometryObject) => {
    return this.matches(other.label);
  };

  matches = (name: string) => this.names.find((n) => n === name) !== undefined;
}
