import { LPoint, Obj, Vector } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";

export enum ShowPoint {
  Always = "always",
  Adaptive = "adaptive",
  Hide = "hide",
}
export type PointProps = {
  pt: Vector;
  label: string;
  offset: Vector;
  showPoint?: ShowPoint;
} & BaseGeometryProps;

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  readonly showPoint: ShowPoint;
  public offset: Vector = [5, 5];
  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
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

  // deprecated
  onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = [""];
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    const textId = this.getId(Obj.Point, this.label);
    const ele = document.getElementById(textId);
    setStyle(ele);
  };
}
