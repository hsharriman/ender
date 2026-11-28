import { ArcProps } from "../types/geometryTypes";
import { Obj } from "../types/types";
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
    this.names = new Set([
      `${this.center.label}${this.start.label}${this.end.label}`,
      `${this.center.label}${this.end.label}${this.start.label}`,
    ]);
    // Arcs between the same two points on opposite sides are different arcs.
    this.id =
      this.getId(Obj.Arc, this.label) +
      (this.opposite ? `-${this.opposite.label}` : "");
  }
}
