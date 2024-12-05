import { ModeCSS } from "../diagramSvg/SVGStyles";
import { LPoint, Obj, Vector } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";

export type PointProps = {
  pt: [number, number];
  label: string;
  showLabel?: boolean;
  offset: Vector;
  showPoint?: boolean;
} & BaseGeometryProps;

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  private showLabel: boolean;
  readonly showPoint: boolean;
  public offset: Vector = [3, 3]; // TODO better label placement
  constructor(props: PointProps) {
    super(Obj.Point, props);
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
    this.showLabel = props.showLabel ?? true;
    this.offset = props.offset;
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
    this.showPoint = props.showPoint ?? false;
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  setOffset = (offset: Vector) => {
    this.offset = offset;
  };

  onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.DIAGRAMTEXTGLOW.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    const textId = this.getId(Obj.Point, this.label);
    const ele = document.getElementById(textId);
    setStyle(ele);
  };
}
