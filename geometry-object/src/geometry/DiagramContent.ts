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
  ctx: DiagramCtx;
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
    return this.getSegment(s.label) ?? s;
  };

  addAngle = (props: AngleProps) => {
    let a = new Angle(props);
    return this.getAngle(a.label) ?? this.overlap(a);
  };

  addTriangle = (props: TriangleProps) => {
    let t = new Triangle(props);
    if (!this.getTriangle(t.label)) {
      this.ctx.triangles.push(t);
      this.addSegments(t.s);
      this.addAngles(t.a);
    }
    return this.getTriangle(t.label) ?? t;
  };

  addQuadrilateral = (props: QuadrilateralProps) => {
    const q = new Quadrilateral(props);
    if (!this.getQuadrilateral(q.label)) {
      this.ctx.rectangles.push(q);
      this.addSegments(q.s);
      this.addAngles(q.a);
    }
    return this.getQuadrilateral(q.label) ?? q;
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
    if (str.startsWith("t_")) {
      str = str.slice(2);
    }
    const [a, b, c] = str.split("").map((c) => this.getPoint(c));
    return this.addTriangle({ pts: [a, b, c] });
  };

  addQuadrilateralFromStr = (str: string) => {
    if (str.startsWith("q_")) {
      str = str.slice(2);
    }
    const [a, b, c, d] = str.split("").map((c) => this.getPoint(c));
    return this.addQuadrilateral({ pts: [a, b, c, d] });
  };

  addAngleFromStr = (str: string) => {
    if (str.startsWith("a_")) {
      str = str.slice(2);
    }
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
    const [s, c, e] = [a.start.label, a.center.label, a.end.label];
    let overlapsExisting = false;

    const findOverlaps = (segSet: Set<Segment>, angleEnd: string) => {
      if (segSet.size > 0) {
        segSet.forEach((s) => {
          // add an overlapping angle if the center of the angle is one of the segment endpoints
          if (s.label.includes(c)) {
            const overlapLabel = `${angleEnd}${c}${s.label.replace(c, "")}`;
            // does overlapping angle already exist in ctx?
            const existingAngle = this.getAngle(overlapLabel);
            if (existingAngle) {
              // add new angle to existing angle's list of names instead of creating new angle
              overlapsExisting = true;
              existingAngle.addNames(angleEnd, s.label.replace(c, ""));
            } else {
              // overlapping angle isn't tracked, add it to original angle
              a.addNames(angleEnd, s.label.replace(c, ""));
            }
          }
        });
      }
    };

    // get segments that form the angle
    const startToCenter = this.getSegment(`${s}${c}`);
    const endToCenter = this.getSegment(`${c}${e}`);

    // check for overlaps with parent segments
    findOverlaps(startToCenter.getParentSegments(), e); // 3rd pt = end
    findOverlaps(endToCenter.getParentSegments(), s); // 3rd pt = start

    // check for overlaps with sub segments
    findOverlaps(startToCenter.getSubSegments(), e); // 3rd pt = end
    findOverlaps(endToCenter.getSubSegments(), s); // 3rd pt = start

    // if doesn't overlap with existing angles, add the angle to the ctx
    if (!overlapsExisting) {
      this.ctx.angles.push(a);
    }
    return a;
  };

  print = () => {
    console.log(
      "pts",
      this.ctx.points.map((p) => p.label)
    );
    console.log(
      "segs",
      this.ctx.segments.map((s) => s.label)
    );
    console.log(
      "angs",
      this.ctx.angles.map((a) => a.label)
    );
    console.log(
      "tris",
      this.ctx.triangles.map((t) => t.label)
    );
    console.log(
      "quads",
      this.ctx.rectangles.map((q) => q.label)
    );
  };
}
