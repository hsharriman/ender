import { TriangleProps } from "../types/geometryTypes";
import { Obj, ParseObj } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { DiagramContent } from "./DiagramContent";
import { Point } from "./Point";
import { Segment } from "./Segment";

export class Triangle extends BaseGeometryObject {
  s: [Segment, Segment, Segment];
  a: [Angle, Angle, Angle];
  private sorted: boolean;
  p: [Point, Point, Point];
  readonly id: string;

  readonly congruent: Set<string> = new Set();

  constructor(props: TriangleProps) {
    super(Obj.Triangle, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
    this.label = `${props.pts[0].label}${props.pts[1].label}${props.pts[2].label}`;

    this.id = this.getId(Obj.Triangle, this.label);
    this.sorted = false;
  }

  private buildSegments = (
    pts: Point[],
    parentFrame?: string,
  ): [Segment, Segment, Segment] => {
    const sa = new Segment({
      p1: pts[0],
      p2: pts[1],
      parentFrame,
    });
    const sb = new Segment({
      p1: pts[0],
      p2: pts[2],
      parentFrame,
    });
    const sc = new Segment({
      p1: pts[1],
      p2: pts[2],
      parentFrame,
    });

    return [sa, sb, sc];
  };

  private buildAngles = (
    pts: Point[],
    parentFrame?: string,
  ): [Angle, Angle, Angle] => {
    const aa = new Angle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    });
    const ab = new Angle({
      start: pts[1],
      center: pts[0],
      end: pts[2],
      parentFrame,
    });
    const ac = new Angle({
      start: pts[0],
      center: pts[2],
      end: pts[1],
      parentFrame,
    });
    return [aa, ab, ac];
  };

  orderTriangle = (p: [string, string, string], ctx: DiagramContent) => {
    this.p = [ctx.getPoint(p[0]), ctx.getPoint(p[1]), ctx.getPoint(p[2])];
    this.s = this.buildSegments(this.p);
    this.a = this.buildAngles(this.p);
    this.sorted = true;
    return this;
  };

  getThirdPoint = (p1: string, p2: string) => {
    const remaining = this.label.replace(p1, "").replace(p2, "");
    // TODO import error
    // if (remaining.length !== 1) {
    //   logError.geometric.incorrectGetThirdPointArgs(this.label, p1, p2);
    // }
    return remaining;
  };

  isSorted = () => this.sorted;

  getSegmentIndex = (name: string) => {
    return this.s.findIndex((seg) => new Set(seg.names).has(name));
  };

  getAngleIndex = (name: string) => {
    return this.a.findIndex((ang) => new Set(ang.names).has(name));
  };

  getAngleByCenter = (center: string) => {
    return this.a.find(
      (ang) => ang.center.label.toLowerCase() === center.toLowerCase(),
    );
  };

  setCongruent = (frame: string) => {
    this.congruent.add(frame);
    return this;
  };

  containsParseObj = (obj: ParseObj) => {
    if (obj.type === Obj.Segment) {
      return this.s.some((seg) => seg.names.has(obj.v));
    } else if (obj.type === Obj.Angle) {
      return this.a.some((ang) => ang.names.has(obj.v));
    }
    return false;
  };

  contains = (obj: Segment | Angle) => {
    if (obj.tag === Obj.Segment) {
      return this.s.some((seg) => seg.equals(obj as Segment));
    } else {
      return this.a.some((ang) => ang.equals(obj as Angle));
    }
  };
}
