import { CircleProps } from "geometry-object/types/geometryTypes";
import { LCircle, Obj } from "geometry-object/types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";

export class Circle extends BaseGeometryObject {
  public readonly center: Point;
  public readonly radius: Point;
  public id: string;
  constructor(props: CircleProps) {
    super(Obj.Circle, props);
    this.center = props.center;
    this.radius = props.radius;
    this.label = `${this.center.label}${this.radius.label}`;
    this.names = new Set([this.label]);
    this.id = this.getId(Obj.Circle, this.label);
  }

  labeled = (): LCircle => {
    return {
      center: this.center.pt,
      radius: this.radius.pt,
      label: this.label,
    };
  };

  // TODO every time on_line is called, need to add the circle to the this.names set
}
