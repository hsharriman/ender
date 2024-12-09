import { AspectRatio } from "./diagramSvg/svgTypes";
import { Angle, AngleProps } from "./geometry/Angle";
import { Point, PointProps } from "./geometry/Point";
import { Quadrilateral, QuadrilateralProps } from "./geometry/Quadrilateral";
import { Segment, SegmentProps } from "./geometry/Segment";
import { Triangle, TriangleProps } from "./geometry/Triangle";
import { Obj } from "./types/types";
import { getId } from "./utils";

export interface DiagramContent {
  points: Point[];
  segments: Segment[]; // every segment tracks its own mode during build
  angles: Angle[];
  triangles: Triangle[];
  rectangles: Quadrilateral[];
  frames: string[];
  deps: Map<string, Set<string>>;
  aspect: AspectRatio;
}

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle;
export class Content {
  private ctx: DiagramContent;
  constructor() {
    this.ctx = {
      points: [],
      segments: [],
      angles: [],
      triangles: [],
      rectangles: [],
      frames: [],
      deps: new Map(),
      aspect: AspectRatio.Square,
    };
  }
  getId = getId;

  reliesOn = (id: string, deps: string[]) => {
    // adds dependencies from one step to another
    // key is mode, value is array of modes that it depends on
    this.ctx.deps.set(id, new Set(deps));
  };

  getReliesOn = () => {
    return this.ctx.deps;
  };

  addFrame = (name: string) => {
    this.ctx.frames.push(name);
    return name;
  };

  setAspect = (aspect: AspectRatio) => {
    this.ctx.aspect = aspect;
  };

  getCtx = () => this.ctx;

  addPoint = (props: PointProps) => {
    const pt = new Point(props);
    if (!this.getPoint(pt.label)) this.ctx.points.push(pt);
    return pt;
  };

  addSegment = (props: SegmentProps) => {
    let s = new Segment(props);
    if (!this.getSegment(s.label)) this.ctx.segments.push(s);
    return s;
  };

  addAngle = (props: AngleProps) => {
    let a = new Angle(props);
    if (!this.getAngle(a.label)) this.ctx.angles.push(a);
    return a;
  };

  addTriangle = (props: TriangleProps) => {
    let t = new Triangle(props, this);
    if (!this.getTriangle(t.label)) this.ctx.triangles.push(t);
    return t;
  };

  addQuadrilateral = (props: QuadrilateralProps) => {
    const q = new Quadrilateral(props, this);
    if (!this.getQuadrilateral(q.label)) this.ctx.rectangles.push(q);
    return q;
  };

  addPoints = (propsArr: PointProps[]) => {
    return propsArr.map((props) => this.addPoint(props));
  };

  addSegments = (propsArr: SegmentProps[]) => {
    return propsArr.map((props) => this.addSegment(props));
  };

  addAngles = (propsArr: AngleProps[]) => {
    return propsArr.map((props) => this.addAngle(props));
  };

  addTriangles = (propsArr: TriangleProps[]) => {
    return propsArr.map((props) => this.addTriangle(props));
  };

  addQuadrilaterals = (propsArr: QuadrilateralProps[]) => {
    return propsArr.map((props) => this.addQuadrilateral(props));
  };

  getPoint = (label: string) =>
    this.ctx.points.filter((p) => p.matches(label))[0];
  getSegment = (label: string) =>
    this.ctx.segments.filter((s) => s.matches(label))[0];
  getAngle = (label: string) =>
    this.ctx.angles.filter((a) => a.matches(label))[0];
  getTriangle = (label: string) =>
    this.ctx.triangles.filter((t) => t.matches(label))[0];
  getQuadrilateral = (label: string) =>
    this.ctx.rectangles.filter((r) => r.matches(label))[0];
}
