import { SegmentProps } from "geometry-object/dist/types/geometryTypes";
import { LSegment, SVGModes, TickType } from "geometry-object/dist/types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
export declare class Segment extends BaseGeometryObject {
  readonly p1: Point;
  readonly p2: Point;
  readonly id: string;
  ticks: Map<
    string,
    {
      type: TickType;
      num: number;
    }
  >;
  constructor(props: SegmentProps);
  labeled: () => LSegment;
  mode: (frameKey: string, mode: SVGModes) => this;
  addTick: (frame: string, type: TickType, num?: number) => this;
  inheritTick: (frame: string, prevFrame: string) => void;
  hideTick: (frame: string) => void;
  getTick: (frame: string) =>
    | {
        type: TickType;
        num: number;
      }
    | undefined;
}
//# sourceMappingURL=Segment.d.ts.map
