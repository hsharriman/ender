import { Obj } from "geometry-object/types/types";
import {
  AngleProps,
  ArcProps,
  CircleProps,
  PointProps,
  ProofCtx,
  QuadrilateralProps,
  SegmentProps,
  TriangleProps,
} from "../types/geometryTypes";
import { Angle } from "./Angle";
import { Arc } from "./Arc";
import { Circle } from "./Circle";
import { Point } from "./Point";
import { Quadrilateral } from "./Quadrilateral";
import { Segment } from "./Segment";
import { Triangle } from "./Triangle";

type ObjectKind =
  | "segment"
  | "angle"
  | "triangle"
  | "quadrilateral"
  | "circle"
  | "arc";

/**
 * The objects of one proof's figure and how each is drawn in every frame.
 * Each layer of a walkthrough (the figure, its highlights, its additions)
 * builds its own, so their modes never mix.
 */
export class ProofContent {
  readonly ctx: ProofCtx = {
    points: [],
    segments: [],
    angles: [],
    triangles: [],
    quads: [],
    circles: [],
    arcs: [],
    frames: [],
    deps: new Map(),
  };
  /** The checker's ray representatives, keyed vertex then point (`"PT"`). */
  private readonly rays: Map<string, string>;
  private readonly warnedMissing = new Set<string>();

  constructor(rays: Map<string, string> = new Map()) {
    this.rays = rays;
  }

  /** Record which frames a frame depends on. */
  reliesOn = (id: string, deps: string[]) => {
    this.ctx.deps.set(id, new Set(deps));
  };

  getReliesOn = () => this.ctx.deps;

  addFrame = (name: string) => {
    this.ctx.frames.push(name);
    return name;
  };

  getCtx = () => this.ctx;

  addPoint = (props: PointProps) => {
    const existing = this.findPoint(props.label);
    if (existing) return existing;
    const pt = new Point(props);
    this.ctx.points.push(pt);
    return pt;
  };

  addSegment = (props: SegmentProps) => {
    const s = new Segment(props);
    const existing = this.findSegment(s.label);
    if (existing) return existing;
    this.ctx.segments.push(s);
    return s;
  };

  /**
   * An angle the checker treats as one already drawn (its sides run through
   * other points of the same rays) is that angle, under one more name.
   */
  addAngle = (props: AngleProps) => {
    const a = new Angle(props);
    const existing = this.findAngle(a.label) ?? this.findSameAngle(a.label);
    if (existing) {
      existing.addNames(a.start.label, a.end.label);
      return existing;
    }
    this.ctx.angles.push(a);
    return a;
  };

  addTriangle = (props: TriangleProps) => {
    const t = new Triangle(props);
    const existing = this.findTriangle(t.label);
    if (existing) return existing;
    this.ctx.triangles.push(t);
    t.s.forEach((s) => this.addSegment(s));
    t.a.forEach((a) => this.addAngle(a));
    return t;
  };

  addQuadrilateral = (props: QuadrilateralProps) => {
    const q = new Quadrilateral(props);
    const existing = this.findQuadrilateral(q.label);
    if (existing) {
      if (props.typeOpts && !existing.typeOpts)
        existing.typeOpts = props.typeOpts;
      return existing;
    }
    this.ctx.quads.push(q);
    q.s.forEach((s) => this.addSegment(s));
    q.a.forEach((a) => this.addAngle(a));
    return q;
  };

  addCircle = (props: CircleProps) => {
    const c = new Circle(props);
    const existing = this.findCircle(c.label);
    if (existing) return existing;
    this.ctx.circles.push(c);
    return c;
  };

  /** Arcs between the same points on opposite sides are kept apart by id. */
  addArc = (props: ArcProps) => {
    const a = new Arc(props);
    const existing = this.ctx.arcs.find((b) => b.id === a.id);
    if (existing) return existing;
    this.ctx.arcs.push(a);
    return a;
  };

  addSegmentFromStr = (str: string) => {
    const [p1, p2] = this.points(str, "");
    return this.addSegment({ p1, p2 });
  };

  addTriangleFromStr = (str: string) => {
    const [a, b, c] = this.points(str, "t_");
    return this.addTriangle({ pts: [a, b, c] });
  };

  addQuadrilateralFromStr = (
    str: string,
    typeOpts?: QuadrilateralProps["typeOpts"],
  ) => {
    const [a, b, c, d] = this.points(str, "q_");
    return this.addQuadrilateral({ pts: [a, b, c, d], typeOpts });
  };

  addAngleFromStr = (str: string) => {
    const [start, center, end] = this.points(str, "a_");
    return this.addAngle({ start, center, end });
  };

  addCircleFromStr = (str: string) => {
    const [center, radius] = this.points(str, "c_");
    return this.addCircle({ center, radius });
  };

  addArcFromStr = (str: string) => {
    const [center, start, end] = this.points(str, "r_");
    return this.addArc({ center, start, end });
  };

  getPoint = (label: string) => this.findPoint(label) as Point;
  getSegment = (label: string) =>
    this.found(Obj.Segment, label, this.findSegment(label));
  getAngle = (label: string) =>
    this.found(
      Obj.Angle,
      label,
      this.findAngle(label) ?? this.findSameAngle(label),
    );
  getTriangle = (label: string) =>
    this.found(Obj.Triangle, label, this.findTriangle(label));
  getQuadrilateral = (label: string) =>
    this.found(Obj.Quadrilateral, label, this.findQuadrilateral(label));
  getCircle = (label: string) =>
    this.found(Obj.Circle, label, this.findCircle(label));
  getArc = (label: string) => this.found(Obj.Arc, label, this.findArc(label));

  /** The named points of an object's letters; every one must be declared. */
  private points = (str: string, prefix: string): Point[] =>
    (str.startsWith(prefix) ? str.slice(prefix.length) : str)
      .split("")
      .map((label) => this.findPoint(label)!);

  /**
   * The angle at `label[1]`, read through the checker's ray representatives
   * so every spelling of one angle gives the same key.
   */
  private angleKey = (label: string) => {
    const [start, center, end] = label;
    const rep = (p: string) => this.rays.get(`${center}${p}`) ?? p;
    return `${center}:${[rep(start), rep(end)].sort().join("")}`;
  };

  private findSameAngle = (label: string) => {
    if (label.length !== 3) return undefined;
    const key = this.angleKey(label);
    return this.ctx.angles.find((a) => this.angleKey(a.label) === key);
  };

  private found = <T>(kind: Obj, label: string, obj: T | undefined) => {
    if (!obj && !this.warnedMissing.has(`${kind}:${label}`)) {
      this.warnedMissing.add(`${kind}:${label}`);
      console.log(`[diagram] Missing ${kind} reference: "${label}"`);
    }
    return obj as T;
  };

  private findPoint = (label: string) =>
    this.ctx.points.find((p) => p.matches(label));
  private findSegment = (label: string) =>
    this.ctx.segments.find((s) => s.matches(label));
  private findAngle = (label: string) =>
    this.ctx.angles.find((a) => a.matches(label));
  private findTriangle = (label: string) =>
    this.ctx.triangles.find((t) => t.matches(label));
  private findQuadrilateral = (label: string) =>
    this.ctx.quads.find((q) => q.matches(label));
  private findCircle = (label: string) =>
    this.ctx.circles.find((c) => c.matches(label));
  private findArc = (label: string) =>
    this.ctx.arcs.find((a) => a.matches(label));
}
