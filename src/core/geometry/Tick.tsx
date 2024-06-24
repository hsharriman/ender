import { LAngle, LSegment, Obj, TickType } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";

export type TickProps = {
  parent: LSegment | LAngle;
  type: TickType;
  num: number;
} & BaseGeometryProps;

export class Tick extends BaseGeometryObject {
  // 1 segment and type of tick
  parent: LSegment | LAngle;
  type: TickType;
  num: number;
  id: string;
  prevFrame: string | undefined;
  constructor(props: TickProps) {
    super(Obj.Tick, props);
    this.parent = props.parent;
    this.type = props.type;
    this.num = props.num;
    this.id = this.getId(this.type, this.parent.label, this.num);
    this.id =
      props.parentFrame !== undefined
        ? `${props.parentFrame}-${this.id}`
        : this.id;
  }
}
