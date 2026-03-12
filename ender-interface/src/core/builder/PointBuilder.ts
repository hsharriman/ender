import { Obj, Point, PointProps, ShowPoint, Vector } from "geometry-object";
import { BaseBuilderObject } from "./BaseObject";

export type PointBuilderProps = {
  point: Point;
  offset: Vector;
  showPoint?: ShowPoint;
} & PointProps;

export class PointBuilder extends BaseBuilderObject {
  readonly showPoint: ShowPoint;
  public offset: Vector = [5, 5];
  readonly point: Point;
  constructor(props: PointBuilderProps) {
    super(Obj.Point, props);
    this.point = props.point;
    this.offset = props.offset;
    this.showPoint = props.showPoint ?? ShowPoint.Hide;
  }

  setOffset = (offset: Vector) => {
    this.offset = offset;
  };
}
