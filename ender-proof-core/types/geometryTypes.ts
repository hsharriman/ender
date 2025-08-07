import { Angle } from "../geometry/Angle";
import { Point } from "../geometry/Point";
import { Quadrilateral } from "../geometry/Quadrilateral";
import { Segment } from "../geometry/Segment";
import { Triangle } from "../geometry/Triangle";
import { AspectRatio, Obj, Vector } from "./types";

export interface BaseGeometryProps {
  activeIdx?: number; // follows the state of the app
  parentFrame?: string;
  // hoverable: boolean; // deprecated
}

export enum ShowPoint {
  Always = "always",
  Adaptive = "adaptive",
  Hide = "hide",
}
export type PointProps = {
  pt: Vector;
  label: string;
  offset: Vector;
  showPoint?: ShowPoint;
} & BaseGeometryProps;

export type SegmentProps = {
  p1: Point;
  p2: Point;
} & BaseGeometryProps;

export type AngleProps = {
  start: Point;
  center: Point;
  end: Point;
} & BaseGeometryProps;

export type TriangleProps = {
  pts: [Point, Point, Point];
  rotatePattern?: boolean;
  // add things like type of triangle, isos, right, etc.
} & BaseGeometryProps;

export type QuadrilateralProps = {
  pts: [Point, Point, Point, Point];
} & BaseGeometryProps;

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle;

export type DiagramCtx = {
  points: Point[];
  segments: Segment[]; // every segment tracks its own mode during build
  angles: Angle[];
  triangles: Triangle[];
  rectangles: Quadrilateral[];
  frames: string[];
  deps: Map<string, Set<string>>;
  aspect: AspectRatio;
};
