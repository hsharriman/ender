import { BaseGeometryProps } from "geometry-object/dist/types/geometryTypes";
import { Obj, SVGModes } from "geometry-object/dist/types/types";
export declare class BaseGeometryObject {
  readonly tag: Obj;
  names: string[];
  label: string;
  protected modes: Map<string, SVGModes>;
  activeIdx: number;
  constructor(tag: Obj, props: BaseGeometryProps);
  protected permutator: (inputArr: string[]) => string[];
  protected getId: (
    objectType: Obj,
    label: string,
    tickNumber?: number
  ) => string;
  getMode: (frameKey: string) => SVGModes | undefined;
  mode: (frameKey: string, mode: SVGModes) => this;
  onClickText: (isActive: boolean) => void;
  isEqualTo: (other: BaseGeometryObject) => boolean;
  matches: (name: string) => boolean;
}
//# sourceMappingURL=BaseGeometryObject.d.ts.map
