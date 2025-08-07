import { QuadrilateralProps } from "../types/geometryTypes";
import { Obj, SVGModes } from "../types/types";
import { Angle } from "./Angle";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
export class Quadrilateral extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle, Angle];
  readonly p: [Point, Point, Point, Point];

  constructor(props: QuadrilateralProps) {
    super(Obj.Quadrilateral, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, props.parentFrame);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, props.parentFrame);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
  }

  private buildSegments = (
    pts: Point[],
    parentFrame?: string
  ): [Segment, Segment, Segment, Segment] => {
    const sa = new Segment({
      p1: pts[0],
      p2: pts[1],
      parentFrame,
    });
    const sb = new Segment({
      p1: pts[1],
      p2: pts[2],
      parentFrame,
    });
    const sc = new Segment({
      p1: pts[2],
      p2: pts[3],
      parentFrame,
    });
    const sd = new Segment({
      p1: pts[3],
      p2: pts[0],
      parentFrame,
    });
    return [sa, sb, sc, sd];
  };

  private buildAngles = (
    pts: Point[],
    parentFrame?: string
  ): [Angle, Angle, Angle, Angle] => {
    const aa = new Angle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    });
    const ab = new Angle({
      start: pts[1],
      center: pts[2],
      end: pts[3],
      parentFrame,
    });
    const ac = new Angle({
      start: pts[3],
      center: pts[0],
      end: pts[1],
      parentFrame,
    });
    const ad = new Angle({
      start: pts[2],
      center: pts[3],
      end: pts[0],
      parentFrame,
    });
    return [aa, ab, ac, ad];
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
    this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.s.forEach((seg) => seg.mode(frameKey, mode));
    this.a.forEach((ang) => ang.mode(frameKey, mode));
    return this;
  };
}
