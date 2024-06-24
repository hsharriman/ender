import { Obj, SVGModes } from "../types/types";
import { getId } from "../utils";

export interface BaseGeometryProps {
  activeIdx?: number; // follows the state of the app
  parentFrame?: string;
  hoverable: boolean;
}

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: string[] = [];
  public label: string = "";
  protected modes: Map<string, SVGModes>;
  public activeIdx: number;
  readonly hoverable: boolean;
  getId = getId;
  constructor(tag: Obj, props: BaseGeometryProps) {
    this.tag = tag;
    this.modes = new Map<string, SVGModes>();
    this.activeIdx = props.activeIdx ? props.activeIdx : -1;
    this.hoverable = props.hoverable;
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  onClickText = (isActive: boolean) => {
    // TODO implementation
  };

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
}
