import { PointProps } from "../types/geometryTypes";
import { Obj, ShowPoint, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  public readonly offset: Vector;
  public showPoint: ShowPoint;

  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = new Set([this.label]);
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
    this.offset = props.offset ?? [5, 5];
    this.showPoint = props.showPoint ?? ShowPoint.Hide;
  }

  setShowPoint = (showPoint: ShowPoint) => {
    this.showPoint = showPoint;
    return this;
  };
}
