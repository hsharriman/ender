import { Content } from "../objgraph";
import { Obj, SVGModes } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { Angle } from "./Angle";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export type TriangleProps = {
  pts: [Point, Point, Point];
  // add things like type of triangle, isos, right, etc.
} & BaseGeometryProps;
export class Triangle extends BaseGeometryObject {
  readonly s: [Segment, Segment, Segment];
  readonly a: [Angle, Angle, Angle];
  readonly p: [Point, Point, Point];

  constructor(props: TriangleProps, ctx: Content) {
    super(Obj.Triangle, props);
    this.p = props.pts;

    this.s = this.buildSegments(props.pts, ctx);
    this.p = props.pts;
    this.a = this.buildAngles(props.pts, ctx);
    this.names = this.permutator(props.pts.map((pt) => pt.label));
  }

  private buildSegments = (
    pts: Point[],
    ctx: Content
  ): [Segment, Segment, Segment] => {
    const sa = ctx.push(new Segment({ p1: pts[0], p2: pts[1] }));
    const sb = ctx.push(new Segment({ p1: pts[0], p2: pts[2] }));
    const sc = ctx.push(new Segment({ p1: pts[1], p2: pts[2] }));
    return [sa, sb, sc];
  };

  private buildAngles = (pts: Point[], ctx: Content): [Angle, Angle, Angle] => {
    const aa = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[1],
        end: pts[2],
      })
    );
    const ab = ctx.push(
      new Angle({
        start: pts[1],
        center: pts[0],
        end: pts[2],
      })
    );
    const ac = ctx.push(
      new Angle({
        start: pts[0],
        center: pts[2],
        end: pts[1],
      })
    );
    return [aa, ab, ac];
  };

  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    return this.s
      .flatMap((seg) => seg.svg(frameIdx, miniScale, style))
      .concat(this.a.flatMap((ang) => ang.svg(frameIdx, miniScale, style)));
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    if (isActive) {
      // for each segment use onClickText
      this.s.map((seg) => {
        seg.onClickText(activeColor)(isActive);
      });
      this.a.map((ang) => {
        ang.onClickText(activeColor)(isActive);
      });
    }
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Triangle}
      />
    );
  };

  override mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    // cascading update the segments and angles
    this.s.map((seg) => seg.mode(frameKey, mode));
    this.a.map((ang) => ang.mode(frameKey, mode));
    // TODO cascading update the segments and angles too
    // TODO special handling for the tick marks which may be
    // hidden in some modes.
    // maybe we don't set the mode on the tick marks for ones
    // that haven't been rendered yet, so "not found" means that
    // it should be hidden.
    return this;
  };
}
