import { PointProps } from "../types/geometryTypes";
import { Obj, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;

  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = new Set([this.label]);
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
  }
}
