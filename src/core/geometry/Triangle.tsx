import { Content } from "../diagramContent";
import { Obj, SVGModes } from "../types/types";
import { permutator } from "../utils";
import { Angle } from "./Angle";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export type TriangleProps = {
  pts: [Point, Point, Point];
  label: string;
  backgroundColor?: string;
  // add things like type of triangle, isos, right, etc.
} & BaseGeometryProps;
export class Triangle extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle];
  readonly p: [Point, Point, Point];
  readonly id: string;
  readonly backgroundColor: string;

  constructor(props: TriangleProps, ctx: Content) {
    super(Obj.Triangle, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, ctx);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, ctx);
    this.names = permutator(props.pts.map((pt) => pt.label));
    this.label = props.label;
    this.id = this.getId(Obj.Triangle, this.label);
    this.backgroundColor = props.backgroundColor ?? "";
  }

  private buildSegments = (
    pts: Point[],
    ctx: Content,
    parentFrame?: string
  ): [Segment, Segment, Segment] => {
    const sa = ctx.push(
      new Segment({
        p1: pts[0],
        p2: pts[1],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    const sb = ctx.push(
      new Segment({
        p1: pts[0],
        p2: pts[2],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    const sc = ctx.push(
      new Segment({
        p1: pts[1],
        p2: pts[2],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    return [sa, sb, sc];
  };

  private buildAngles = (
    pts: Point[],
    ctx: Content,
    parentFrame?: string
  ): [Angle, Angle, Angle] => {
    const aa = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[1],
        end: pts[2],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    const ab = ctx.push(
      new Angle({
        start: pts[1],
        center: pts[0],
        end: pts[2],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    const ac = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[2],
        end: pts[1],
        parentFrame,
        hoverable: this.hoverable,
      })
    );
    return [aa, ab, ac];
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
    return this;
  };

  override highlight = (frameKey: string) => {
    this.s.map((seg) => seg.highlight(frameKey));
    return this;
  };
}
