import {
  AngleProps,
  DiagramCtx,
  PointProps,
  QuadrilateralProps,
  SegmentProps,
  TriangleProps,
} from "geometry-object/dist/types/geometryTypes";
import { AspectRatio } from "geometry-object/dist/types/types";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";
export declare class DiagramContent {
  private ctx;
  constructor();
  reliesOn: (id: string, deps: string[]) => void;
  getReliesOn: () => Map<string, Set<string>>;
  addFrame: (name: string) => string;
  setAspect: (aspect: AspectRatio) => void;
  getCtx: () => DiagramCtx;
  addPoint: (props: PointProps) => Point;
  addSegment: (props: SegmentProps) => Segment;
  addAngle: (props: AngleProps) => Angle;
  addTriangle: (props: TriangleProps) => Triangle;
  addQuadrilateral: (props: QuadrilateralProps) => Quadrilateral;
  addPoints: (propsArr: PointProps[]) => Point[];
  addSegments: (propsArr: SegmentProps[]) => Segment[];
  addAngles: (propsArr: AngleProps[]) => Angle[];
  addTriangles: (propsArr: TriangleProps[]) => Triangle[];
  addQuadrilaterals: (propsArr: QuadrilateralProps[]) => Quadrilateral[];
  addSegmentFromStr: (str: string) => Segment;
  addTriangleFromStr: (str: string) => Triangle;
  addAngleFromStr: (str: string) => Angle;
  getPoint: (label: string) => Point;
  getSegment: (label: string) => Segment;
  getAngle: (label: string) => Angle;
  getTriangle: (label: string) => Triangle;
  getQuadrilateral: (label: string) => Quadrilateral;
}
//# sourceMappingURL=DiagramContent.d.ts.map
