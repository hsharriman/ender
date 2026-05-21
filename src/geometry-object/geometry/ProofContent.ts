import {
  AngleProps,
  PointProps,
  ProofCtx,
  QuadrilateralProps,
  SegmentProps,
  TriangleProps,
} from "../types/geometryTypes";
import { Obj, ParseObj } from "../types/types";
import { Angle } from "./Angle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";

type CongruentAngStmt = {
  function: string;
  arguments: ParseObj[];
};

// TODO rename to ProofContent
export class ProofContent {
  ctx: ProofCtx;
  constructor(prevCtx?: ProofCtx) {
    this.ctx = prevCtx ?? {
      points: [],
      segments: [],
      angles: [],
      triangles: [],
      rectangles: [],
      frames: [],
      deps: new Map(),
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
    const a = new Angle(props);
    const exact = this.ctx.angles.find((ang) => ang.label === a.label);
    if (exact) return exact;
    return this.overlap(a);
  };

  addTriangle = (props: TriangleProps) => {
    const t = new Triangle(props);
    const exact = this.ctx.triangles.find((tri) => tri.label === t.label);
    if (exact) return exact;
    this.ctx.triangles.push(t);
    this.addSegments(t.s);
    this.addAngles(t.a);
    return t;
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
    const labels = str.split("");
    const pts = labels.map((c) => this.getPoint(c));
    const exact = this.ctx.triangles.find((t) => t.label === labels.join(""));
    if (exact) return exact;
    return this.addTriangle({ pts });
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
    const bare = `${a.label}${b.label}${c.label}`;
    const exact = this.ctx.angles.find((ang) => ang.label === bare);
    if (exact) return exact;
    return this.addAngle({ start: a, center: b, end: c });
  };

  getPoint = (label: string) =>
    this.ctx.points.filter((p) => p.matches(label))[0];
  getSegment = (label: string) =>
    this.ctx.segments.filter((s) => s.matches(label))[0];
  getAngle = (label: string) => {
    const bare = label.startsWith("a_") ? label.slice(2) : label;
    return (
      this.ctx.angles.find((a) => a.label === bare) ??
      this.ctx.angles.find((a) => a.matches(label))
    );
  };

  /** True when two angle labels denote the same angle via shared `names` entries. */
  angleLabelsOverlap = (labelA: string, labelB: string): boolean => {
    const a = this.getAngle(labelA) ?? this.addAngleFromStr(labelA);
    const b = this.getAngle(labelB) ?? this.addAngleFromStr(labelB);
    for (const name of a.names) {
      if (b.names.has(name)) return true;
    }
    return this.anglesGeometricallyCoincide(a, b);
  };

  angleObjectsOverlap = (left: Angle, right: Angle): boolean => {
    for (const name of left.names) {
      if (right.names.has(name)) return true;
    }
    return this.anglesGeometricallyCoincide(left, right);
  };

  /** Same vertex and the same open angle (both rays). */
  anglesSameSector = (left: Angle, right: Angle): boolean => {
    if (!left.center.equals(right.center)) return false;
    const leftEnds = [left.start.label, left.end.label];
    const rightEnds = [right.start.label, right.end.label];
    return (
      (leftEnds[0] === rightEnds[0] && leftEnds[1] === rightEnds[1]) ||
      (leftEnds[0] === rightEnds[1] && leftEnds[1] === rightEnds[0])
    );
  };

  /** Same vertex and at least one shared ray endpoint (overlapping angle sectors). */
  anglesGeometricallyCoincide = (left: Angle, right: Angle): boolean => {
    if (!left.center.equals(right.center)) return false;
    const leftEnds = [left.start.label, left.end.label];
    const rightEnds = [right.start.label, right.end.label];
    return leftEnds.some((end) => rightEnds.includes(end));
  };

  /**
   * When `angleLabel` overlaps an interior angle of `tri`, return a label for that
   * interior angle (preserving `a_` prefix when the query used one).
   */
  interiorAngleLabelForTriangle = (
    tri: Triangle,
    angleLabel: string,
  ): string | undefined => {
    const probe = this.addAngleFromStr(angleLabel);
    for (const interior of tri.a) {
      if (!probe.center.equals(interior.center)) continue;
      if (!tri.p.some((pt) => pt.label === probe.center.label)) continue;
      if (!this.angleObjectsOverlap(probe, interior)) continue;
      return angleLabel.startsWith("a_")
        ? `a_${interior.label}`
        : interior.label;
    }
    return undefined;
  };

  /** Map `con_ang` args to each triangle's overlapping interior angle, when present. */
  resolveCongruentAngForTriangles = (
    stmt: CongruentAngStmt,
    tri1: Triangle,
    tri2: Triangle,
  ): CongruentAngStmt => {
    if (stmt.function !== "con_ang" || stmt.arguments.length !== 2) {
      return stmt;
    }
    const [left, right] = stmt.arguments;
    if (left.type !== Obj.Angle || right.type !== Obj.Angle) {
      return stmt;
    }
    const l =
      this.interiorAngleLabelForTriangle(tri1, left.v) ?? left.v;
    const r =
      this.interiorAngleLabelForTriangle(tri2, right.v) ?? right.v;
    return {
      function: "con_ang",
      arguments: [
        { type: Obj.Angle, v: l },
        { type: Obj.Angle, v: r },
      ],
    };
  };
  getTriangle = (label: string) => {
    const bare = label.startsWith("t_") ? label.slice(2) : label;
    return (
      this.ctx.triangles.find((t) => t.label === bare) ??
      this.ctx.triangles.find((t) => t.matches(bare))
    );
  };
  getQuadrilateral = (label: string) =>
    this.ctx.rectangles.filter((r) => r.matches(label))[0];

  /** Share `names` entries between diagram angles and triangle interior angles. */
  syncTriangleInteriorAngleNames = () => {
    for (const tri of this.ctx.triangles) {
      for (const interior of tri.a) {
        for (const ctxAng of this.ctx.angles) {
          if (!ctxAng.center.equals(interior.center)) continue;
          if (
            !this.angleObjectsOverlap(ctxAng, interior) &&
            !this.anglesSameSector(ctxAng, interior)
          ) {
            continue;
          }
          for (const name of ctxAng.names) {
            interior.names.add(name);
            if (!name.startsWith("a_")) {
              interior.names.add(`a_${name}`);
            }
          }
        }
      }
    }
  };

  checkAngleOverlaps = () => {
    this.ctx.angles.forEach((a) => this.overlap(a));
    this.syncTriangleInteriorAngleNames();
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
              existingAngle.addNames(angleEnd, s.label.replace(c, ""));
              if (this.anglesSameSector(a, existingAngle)) {
                overlapsExisting = true;
              }
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
      this.ctx.points.map((p) => p.label),
    );
    console.log(
      "segs",
      this.ctx.segments.map((s) => s.label),
    );
    console.log(
      "angs",
      this.ctx.angles.map((a) => a.label),
    );
    console.log(
      "tris",
      this.ctx.triangles.map((t) => t.label),
    );
    console.log(
      "quads",
      this.ctx.rectangles.map((q) => q.label),
    );
  };
}
