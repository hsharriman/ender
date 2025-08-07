import { TriangleProps } from "geometry-object/dist/types/geometryTypes";
import { SVGModes } from "geometry-object/dist/types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export declare class Triangle extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle];
  readonly p: [Point, Point, Point];
  readonly id: string;
  readonly rotatePattern: boolean;
  readonly congruent: Set<string>;
  constructor(props: TriangleProps);
  private buildSegments;
  private buildAngles;
  onClickText: (isActive: boolean) => void;
  mode: (frameKey: string, mode: SVGModes) => this;
  labelMode: (frameKey: string, mode: SVGModes) => this;
  setCongruent: (frame: string) => this;
}
//# sourceMappingURL=Triangle.d.ts.map
