import { Obj, Vector } from "../types";
import { vops } from "../vectorOps";

const SVG_XSHIFT = 40;
const SVG_YSHIFT = 0;
const SVG_SCALE = 20;
const SVG_DIM = 200;
const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 8;

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: string[] = [];
  public label: string = "";
  constructor(tag: Obj) {
    this.tag = tag;
  }

  // https://stackoverflow.com/questions/9960908/permutations-in-javascript
  permutator = (inputArr: string[]): string[] => {
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

  matches = (name: string) => this.names.find((n) => n === name) !== undefined;

  // From EuclideanBuilder SVG Related
  coordsToSvg = (coords: Vector, offset: Vector = [0, 0]): Vector => {
    // scale coordinates, shift and invert y axis
    // TODO scale the transformation based on canvas size
    let vec = vops.add(vops.smul(coords, SVG_SCALE), [
      SVG_XSHIFT + offset[0],
      SVG_YSHIFT + offset[1],
    ]);
    return [vec[0], SVG_DIM - vec[1]];
  };

  scaleToSvg = (n: number) => n * SVG_SCALE;

  getId = (objectType: Obj, label: string, tickNumber?: number) => {
    if (objectType === Obj.Angle) {
      const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
      label = `${label[1]}-${endPts}`;
    } else {
      label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  };

  // method to check whether ticks should be included in the render or not
}
