import {
  Angle,
  Circle,
  Point,
  PointProps,
  Quadrilateral,
  Segment,
  Triangle,
  Vector,
} from "geometry-object";
import { DiagramRenderCtx, ShowPoint } from "../types/diagramTypes";
import {
  AngleBuilder,
  CircleBuilder,
  PointBuilder,
  QuadrilateralBuilder,
  SegmentBuilder,
  TriangleBuilder,
} from "./GeoObjectBuilders";

// TODO has lots of redundancy with ProofContent
export class DiagramContent {
  private ctx: DiagramRenderCtx;
  private warnedMissingKeys = new Set<string>();
  constructor(ctx?: DiagramRenderCtx) {
    this.ctx = ctx ?? {
      points: [],
      segments: [],
      angles: [],
      triangles: [],
      quads: [],
      circles: [],
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

  addPoint = (
    props: PointProps,
    offset: Vector = [5, 5],
    showPoint?: ShowPoint,
  ) => {
    const pt = new Point(props);
    const ptBuilder = new PointBuilder(pt, showPoint, offset);
    if (!this.findPoint(pt.label)) {
      this.ctx.points.push(ptBuilder);
      return ptBuilder;
    }
    return this.findPoint(pt.label);
  };

  addSegment = (s: Segment) => {
    const sBuilder = new SegmentBuilder(s);
    if (!this.findSegment(s.label)) {
      this.ctx.segments.push(sBuilder);
      return sBuilder;
    }
    return this.findSegment(s.label);
  };

  addAngle = (a: Angle) => {
    const aBuilder = new AngleBuilder(a);
    if (!this.findAngle(a.label)) {
      this.ctx.angles.push(aBuilder);
      return aBuilder;
    }
    return this.findAngle(a.label);
  };

  addTriangle = (t: Triangle, rotatePattern?: boolean) => {
    const tBuilder = new TriangleBuilder(t, rotatePattern);
    if (!this.findTriangle(t.label)) {
      this.ctx.triangles.push(tBuilder);
      this.addSegments(t.s.map((s) => s));
      this.addAngles(t.a.map((a) => a));
      return tBuilder;
    }
    return this.findTriangle(t.label);
  };

  addQuadrilateral = (q: Quadrilateral) => {
    const qBuilder = new QuadrilateralBuilder(q);
    if (!this.findQuadrilateral(q.label)) {
      this.ctx.quads.push(qBuilder);
      this.addSegments(q.s.map((s) => s));
      this.addAngles(q.a.map((a) => a));
      return qBuilder;
    }
    return this.findQuadrilateral(q.label);
  };

  addCircle = (c: Circle) => {
    const cBuilder = new CircleBuilder(c);
    if (!this.findCircle(c.label)) {
      this.ctx.circles.push(cBuilder);
      return cBuilder;
    }
    return this.findCircle(c.label);
  };

  addSegments = (propsArr: Segment[]) => {
    return propsArr.map((s) => this.addSegment(s));
  };

  addAngles = (propsArr: Angle[]) => {
    return propsArr.map((a) => this.addAngle(a));
  };

  private warnMissing = (
    kind: "segment" | "angle" | "triangle" | "quadrilateral" | "circle",
    label: string,
  ) => {
    const key = `${kind}:${label}`;
    if (this.warnedMissingKeys.has(key)) return;
    this.warnedMissingKeys.add(key);
    console.log(`[diagram] Missing ${kind} reference: "${label}"`);
  };

  private findPoint = (label: string) =>
    this.ctx.points.filter((p) => p.obj.matches(label))[0];
  private findSegment = (label: string) =>
    this.ctx.segments.filter((s) => s.obj.matches(label))[0];
  private findAngle = (label: string) =>
    this.ctx.angles.filter((a) => a.obj.matches(label))[0];
  private findTriangle = (label: string) =>
    this.ctx.triangles.filter((t) => t.obj.matches(label))[0];
  private findQuadrilateral = (label: string) =>
    this.ctx.quads.filter((r) => r.obj.matches(label))[0];
  private findCircle = (label: string) =>
    this.ctx.circles.filter((c) => c.obj.matches(label))[0];

  getPoint = (label: string) => this.findPoint(label);
  getSegment = (label: string) => {
    const seg = this.findSegment(label);
    if (!seg) this.warnMissing("segment", label);
    return seg;
  };
  getAngle = (label: string) => {
    const ang = this.findAngle(label);
    if (!ang) this.warnMissing("angle", label);
    return ang;
  };
  getTriangle = (label: string) => {
    const tri = this.findTriangle(label);
    if (!tri) this.warnMissing("triangle", label);
    return tri;
  };
  getQuadrilateral = (label: string) => {
    const quad = this.findQuadrilateral(label);
    if (!quad) this.warnMissing("quadrilateral", label);
    return quad;
  };
  getCircle = (label: string) => {
    const circle = this.findCircle(label);
    if (!circle) this.warnMissing("circle", label);
    return circle;
  };
}
