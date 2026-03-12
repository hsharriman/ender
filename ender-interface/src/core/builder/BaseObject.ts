import { BaseGeometryObject, BaseGeometryProps, Obj } from "geometry-object";
import { SVGModes } from "../types/diagramTypes";

export class BaseBuilderObject extends BaseGeometryObject {
  protected modes: Map<string, SVGModes>;
  constructor(tag: Obj, props: BaseGeometryProps) {
    super(tag, props);
    this.modes = new Map<string, SVGModes>();
  }

  getMode = (frameKey: string) => this.modes.get(frameKey);

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };
}
