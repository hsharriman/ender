import {
  Angle,
  AngleProps,
  Point,
  PointProps,
  Quadrilateral,
  QuadrilateralProps,
  Segment,
  SegmentProps,
  Triangle,
  TriangleProps,
  Vector,
} from "geometry-object";
import { DiagramRenderCtx, ShowPoint } from "../types/diagramTypes";
import {
  AngleBuilder,
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

  addSegment = (props: SegmentProps) => {
    const s = new Segment(props);
    const sBuilder = new SegmentBuilder(s);
    if (!this.findSegment(s.label)) {
      this.ctx.segments.push(sBuilder);
      return sBuilder;
    }
    return this.findSegment(s.label);
  };

  addAngle = (props: AngleProps) => {
    const a = new Angle(props);
    const aBuilder = new AngleBuilder(a);
    if (!this.findAngle(a.label)) {
      this.ctx.angles.push(aBuilder);
      return aBuilder;
    }
    return this.findAngle(a.label);
  };

  addTriangle = (props: TriangleProps, rotatePattern?: boolean) => {
    const t = new Triangle(props);
    const tBuilder = new TriangleBuilder(t, rotatePattern);
    if (!this.findTriangle(t.label)) {
      this.ctx.triangles.push(tBuilder);
      this.addSegments(tBuilder.s.map((s) => s.obj));
      this.addAngles(tBuilder.a.map((a) => a.obj));
      return tBuilder;
    }
    return this.findTriangle(t.label);
  };

  addQuadrilateral = (props: QuadrilateralProps) => {
    const q = new Quadrilateral(props);
    const qBuilder = new QuadrilateralBuilder(q);
    if (!this.findQuadrilateral(q.label)) {
      this.ctx.rectangles.push(qBuilder);
      this.addSegments(qBuilder.s.map((s) => s.obj));
      this.addAngles(qBuilder.a.map((a) => a.obj));
      return qBuilder;
    }
    return this.findQuadrilateral(q.label);
  };

  addPoints = (propsArr: PointProps[]) => {
    return propsArr.map((pt) => this.addPoint(pt));
  };

  addSegments = (propsArr: SegmentProps[]) => {
    return propsArr.map((s) => this.addSegment(s));
  };

  addAngles = (propsArr: AngleProps[]) => {
    return propsArr.map((a) => this.addAngle(a));
  };

  private warnMissing = (
    kind: "segment" | "angle" | "triangle" | "quadrilateral",
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
    this.ctx.rectangles.filter((r) => r.obj.matches(label))[0];

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
}
