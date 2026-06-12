import { BaseGeometryProps } from "../types/geometryTypes";
import { Obj } from "../types/types";

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: Set<string> = new Set();
  public label: string = "";
  public activeIdx: number;

  constructor(tag: Obj, props: BaseGeometryProps) {
    this.tag = tag;
    this.activeIdx = props.activeIdx ? props.activeIdx : -1;
  }

  // https://stackoverflow.com/questions/9960908/permutations-in-javascript
  protected permutator = (inputArr: string[]): Set<string> => {
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
    return new Set(result);
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

  equals = (other: BaseGeometryObject) => {
    return this.matches(other.label);
  };

  matches = (name: string) => this.names.has(name);
}
