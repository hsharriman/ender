import { TriangleProps } from "../types/geometryTypes";
import { Obj, SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export class Triangle extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle];
  readonly p: [Point, Point, Point];
  readonly id: string;
  readonly rotatePattern: boolean;
  readonly congruent: Set<string> = new Set();

  constructor(props: TriangleProps) {
    super(Obj.Triangle, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
    this.label = `${props.pts[0].label}${props.pts[1].label}${props.pts[2].label}`;
    this.rotatePattern = props.rotatePattern || false;
    this.id = this.getId(Obj.Triangle, this.label);
  }

  private buildSegments = (
    pts: Point[],
    parentFrame?: string
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
    parentFrame?: string
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

  // deprecated
  onClickText = (isActive: boolean) => {
    // for each segment use onClickText
    this.s.forEach((seg) => {
      seg.onClickText(isActive);
    });
    this.a.forEach((ang) => {
      ang.onClickText(isActive);
    });
  };

  override mode = (frameKey: string, mode: SVGModes) => {
    // this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.s.map((seg) => seg.mode(frameKey, mode));
    this.a.map((ang) => ang.mode(frameKey, mode));
    return this;
  };

  labelMode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  setCongruent = (frame: string) => {
    this.congruent.add(frame);
    return this;
  };
}
