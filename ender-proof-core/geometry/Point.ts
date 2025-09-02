import { PointProps, ShowPoint } from "../types/geometryTypes";
import { LPoint, Obj, Vector } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Segment } from "./Segment";

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  readonly showPoint: ShowPoint;
  public offset: Vector = [5, 5];
  private onLine: Set<Segment> = new Set();
  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = new Set([this.label]);
    this.offset = props.offset;
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
    this.showPoint = props.showPoint ?? ShowPoint.Hide;
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  setOffset = (offset: Vector) => {
    this.offset = offset;
  };

  addOnLine = (s: Segment) => {
    this.onLine.add(s);
  };

  isOnLine = (s: Segment) => {
    return this.onLine.has(s);
  };

  equals = (p: Point) => {
    return this.names.has(p.label);
  };

  // deprecated - DOM manipulation removed for package independence
  onClickText = (isActive: boolean) => {
    // DOM manipulation removed for package independence
  };
}
