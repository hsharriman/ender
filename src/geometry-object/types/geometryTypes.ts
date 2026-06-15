import { Circle } from "geometry-object/geometry/Circle";
import { Angle } from "../geometry/Angle";
import { Point } from "../geometry/Point";
import { Quadrilateral } from "../geometry/Quadrilateral";
import { Segment } from "../geometry/Segment";
import { Triangle } from "../geometry/Triangle";
import { Obj, Vector } from "./types";

export interface BaseGeometryProps {
  activeIdx?: number; // follows the state of the app
  parentFrame?: string;
}

export type PointProps = {
  pt: Vector;
  label: string;
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
  // add things like type of triangle, isos, right, etc.
} & BaseGeometryProps;

export type QuadrilateralProps = {
  pts: [Point, Point, Point, Point];
  typeOpts?: { type: "trapezoid" | "kite"; objs: [string, string] };
} & BaseGeometryProps;

export type CircleProps = {
  center: Point;
  radius: Point;
} & BaseGeometryProps;

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle
  | Obj.Circle;

export type ProofCtx = {
  points: Point[];
  segments: Segment[]; // every segment tracks its own mode during build
  angles: Angle[];
  triangles: Triangle[];
  rectangles: Quadrilateral[];
  circles: Circle[];
  frames: string[];
  deps: Map<string, Set<string>>;
};
