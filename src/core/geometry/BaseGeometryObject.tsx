import { Obj, SVGModes, Vector } from "../types/types";
import { getId } from "../utils";
import { vops } from "../vectorOps";

const SVG_XSHIFT = 60;
const SVG_YSHIFT = -200;
const TICK_SCALE = 20;
const SVG_SCALE = 60;
const SVG_DIM = 120;

const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 25;
const MINI_SVG_XSHIFT = 20;
const MINI_SVG_YSHIFT = -70;

export interface BaseGeometryProps {
  // modes: Map<string, SVGModes>; // all modes for all states
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

  // method to check whether ticks should be included in the render or not
}
