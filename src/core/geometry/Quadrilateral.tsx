import { Content } from "../diagramContent";
import { Obj, SVGModes } from "../types/types";
import { permutator } from "../utils";
import { Angle } from "./Angle";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export type QuadrilateralProps = {
  pts: [Point, Point, Point, Point];
  // add things like type of triangle, isos, right, etc.
} & BaseGeometryProps;
export class Quadrilateral extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle, Angle];
  readonly p: [Point, Point, Point, Point];

  constructor(props: QuadrilateralProps, ctx: Content) {
    super(Obj.Quadrilateral, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, ctx, props.parentFrame);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, ctx, props.parentFrame);
    this.names = permutator(props.pts.map((pt) => pt.label));
  }

  private buildSegments = (
    pts: Point[],
    ctx: Content,
    parentFrame?: string
  ): [Segment, Segment, Segment, Segment] => {
    const sa = ctx.addSegment({
      p1: pts[0],
      p2: pts[1],
      parentFrame,
    });
    const sb = ctx.addSegment({
      p1: pts[1],
      p2: pts[2],
      parentFrame,
    });
    const sc = ctx.addSegment({
      p1: pts[2],
      p2: pts[3],
      parentFrame,
    });
    const sd = ctx.addSegment({
      p1: pts[3],
      p2: pts[0],
      parentFrame,
    });
    return [sa, sb, sc, sd];
  };

  private buildAngles = (
    pts: Point[],
    ctx: Content,
    parentFrame?: string
  ): [Angle, Angle, Angle, Angle] => {
    const aa = ctx.addAngle({
      start: pts[0],
      center: pts[1],
      end: pts[2],
      parentFrame,
    });
    const ab = ctx.addAngle({
      start: pts[1],
      center: pts[2],
      end: pts[3],
      parentFrame,
    });
    const ac = ctx.addAngle({
      start: pts[3],
      center: pts[0],
      end: pts[1],
      parentFrame,
    });
    const ad = ctx.addAngle({
      start: pts[2],
      center: pts[3],
      end: pts[0],
      parentFrame,
    });
    return [aa, ab, ac, ad];
  };

  onClickText = (isActive: boolean) => {
    // for each segment use onClickText
    this.s.map((seg) => {
      seg.onClickText(isActive);
    });
    this.a.map((ang) => {
      ang.onClickText(isActive);
    });
  };

  override mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.s.map((seg) => seg.mode(frameKey, mode));
    this.a.map((ang) => ang.mode(frameKey, mode));
    // TODO cascading update the segments and angles too
    return this;
  };
}
