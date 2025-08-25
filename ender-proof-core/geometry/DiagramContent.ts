import {
  AngleProps,
  DiagramCtx,
  PointProps,
  QuadrilateralProps,
  SegmentProps,
  TriangleProps,
} from "../types/geometryTypes";
import { AspectRatio } from "../types/types";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";

export class DiagramContent {
  private ctx: DiagramCtx;
  constructor(prevCtx?: DiagramCtx) {
    this.ctx = prevCtx ?? {
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
    if (!this.getAngle(a.label)) {
      this.overlap(a);
    }
    return a;
  };

  addTriangle = (props: TriangleProps) => {
    let t = new Triangle(props);
    if (!this.getTriangle(t.label)) {
      this.ctx.triangles.push(t);
      this.addSegments(t.s);
      this.addAngles(t.a);
    }
    return t;
  };

  addQuadrilateral = (props: QuadrilateralProps) => {
    const q = new Quadrilateral(props);
    if (!this.getQuadrilateral(q.label)) {
      this.ctx.rectangles.push(q);
      this.addSegments(q.s);
      this.addAngles(q.a);
    }
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

  addSegmentFromStr = (str: string) => {
    const [a, b] = str.split("").map((c) => this.getPoint(c));
    return this.addSegment({ p1: a, p2: b });
  };

  addTriangleFromStr = (str: string) => {
    const [a, b, c] = str.split("").map((c) => this.getPoint(c));
    return this.addTriangle({ pts: [a, b, c] });
  };

  addAngleFromStr = (str: string) => {
    const [a, b, c] = str.split("").map((c) => this.getPoint(c));
    return this.addAngle({ start: a, center: b, end: c });
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

  checkAngleOverlaps = () => {
    this.ctx.angles.forEach((a) => this.overlap(a));
  };

  overlap = (a: Angle) => {
    const [s, c, e] = a.label.split("");
    const s1 = this.getSegment(`${s}${c}`);
    const s2 = this.getSegment(`${c}${e}`);
    // for each segment that has a parent identified
    let hasOverlap = false;
    console.log("checking angle at ", s1.label, s2.label);
    const findOverlaps = (segSet: Set<Segment>, angleEnd: string) => {
      console.log(segSet, angleEnd);
      if (segSet.size > 1) {
        segSet.forEach((s) => {
          // add an overlapping angle if the center of the angle is one of the segment endpoints
          if (s.label.includes(c)) {
            const newAngleLabel = `${angleEnd}${c}${s.label.replace(c, "")}`;

            // does new angle already exist?
            const newAngle = this.getAngle(newAngleLabel);
            if (newAngle) {
              hasOverlap = true;
              console.log("adding overlap", newAngleLabel, a.label);
              const parentAngle = newAngle.getParentAngle();
              if (parentAngle) {
                parentAngle.addNames(angleEnd, s.label.replace(c, ""));
              } else {
                newAngle.addNames(angleEnd, s.label.replace(c, ""));
              }
            }
          }
        });
      }
    };
    findOverlaps(s1.getParentSegments(), a.end.label);
    console.log("s1 parent segments", s1.getParentSegments().size, s1.label);
    findOverlaps(s2.getParentSegments(), a.start.label);
    console.log("s2 parent segments", s2.getParentSegments().size, s2.label);
    findOverlaps(s1.getSubSegments(), a.start.label);
    console.log("s1 sub segments", s1.getSubSegments().size, s1.label);
    findOverlaps(s2.getSubSegments(), a.end.label);
    console.log("s2 sub segments", s2.getSubSegments().size, s2.label);
    if (!hasOverlap) {
      this.ctx.angles.push(a);
    }
  };
}
