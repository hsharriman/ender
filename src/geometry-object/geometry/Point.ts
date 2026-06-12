import { PointProps } from "../types/geometryTypes";
import { LPoint, Obj, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Segment } from "./Segment";

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;

  private onLine: Set<Segment> = new Set();
  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = new Set([this.label]);
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  addOnLine = (s: Segment) => {
    this.onLine.add(s);
  };

  isOnLine = (s: Segment) => {
    return this.onLine.has(s);
  };
}
