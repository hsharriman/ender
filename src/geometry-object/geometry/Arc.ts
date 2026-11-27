import { ArcProps } from "../types/geometryTypes";
import { LArc, Obj } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";

export class Arc extends BaseGeometryObject {
  public readonly center: Point;
  public readonly start: Point;
  public readonly end: Point;
  public readonly opposite?: Point;
  public id: string;
  constructor(props: ArcProps) {
    super(Obj.Arc, props);
    this.center = props.center;
    this.start = props.start;
    this.end = props.end;
    this.opposite = props.opposite;
    this.label = `${this.start.label}${this.end.label}`;
    this.names = this.permutator([this.start.label, this.end.label]);
    // Arcs between the same two points on opposite sides are different arcs.
    this.id =
      `${this.getId(Obj.Arc, this.label)}` +
      (this.opposite && `-${this.opposite}`);
  }

  /**
   * Which of the two arcs between the endpoints this is: the one on the
   * left or right of the chord, read from the endpoint named first in the
   * alphabet, or the minor arc.
   */
  // private side = (): string => {
  //   if (!this.opposite) return "minor";
  //   const [a, b] = [this.start, this.end]
  //     .sort((p, q) => p.label.localeCompare(q.label))
  //     .map((p) => this.onCircle(p.pt));
  //   const o = this.opposite.pt;
  //   const cross = (b[0] - a[0]) * (o[1] - a[1]) - (b[1] - a[1]) * (o[0] - a[0]);
  //   // The arc is on the side of the chord away from `opposite`.
  //   return cross > 0 ? "right" : "left";
  // };

  // /**
  //  * Where the line from `opposite` through `pt` meets the circle again, or
  //  * `pt` itself when there is no `opposite`.  For an inscribed angle this
  //  * is where a side, which may stop short of the circle or run past it,
  //  * crosses the circle.
  //  */
  // private onCircle = (pt: Vector): Vector => {
  //   if (!this.opposite) return pt;
  //   const [ox, oy] = this.opposite.pt;
  //   const [cx, cy] = this.center.pt;
  //   const [dx, dy] = [pt[0] - ox, pt[1] - oy];
  //   // `opposite` is on the circle, so the line meets it at t = 0 and here.
  //   const t = (-2 * (dx * (ox - cx) + dy * (oy - cy))) / (dx * dx + dy * dy);
  //   return [ox + t * dx, oy + t * dy];
  // };

  labeled = (): LArc => {
    return {
      center: this.center.pt,
      start: this.start.pt,
      end: this.end.pt,
      opposite: this.opposite?.pt,
      label: this.label,
    };
  };
}
