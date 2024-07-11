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

  getMode = (frameKey: string) => this.modes.get(frameKey);

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  onClickText = (isActive: boolean) => {
    // TODO implementation
  };

  matches = (name: string) => this.names.find((n) => n === name) !== undefined;
}
