import { BaseSVG } from "../svg/BaseSVG";
import { SVGCircle } from "../svg/SVGCircle";
import { SVGText } from "../svg/SVGText";
import { Vector, Obj, LPoint } from "../types";
import { vops } from "../vectorOps";
import { BaseGeometryObject } from "./BaseGeometryObject";

export type PointProps = {
  pt: [number, number];
  label: string;
};

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  constructor(props: PointProps) {
    super(Obj.Point);
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
    this.id = this.getId(Obj.Point, this.label);
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  isEqual = (p: LPoint) => {
    return this.label === p.label && vops.eq(this.pt, p.pt);
  };

  svg = (labeled: boolean = true, style?: React.CSSProperties) => {
    let svgItems: BaseSVG[] = [
      new SVGCircle({
        center: this.coordsToSvg(this.pt),
        r: 2,
        key: this.id,
        style: {
          fill: "black",
          ...style,
        },
      }),
    ];
    if (labeled) svgItems.push(this.addLabel());
    return svgItems;
  };

  addLabel = (offset: Vector = [3, 3], style?: React.CSSProperties) => {
    return new SVGText({
      point: this.coordsToSvg(this.pt, offset),
      key: this.getId(Obj.Text, this.label),
      text: this.label,
      style: {
        font: "12px sans-serif",
        ...style,
      },
    });
  };
}
