import { BaseSVG } from "../svg/BaseSVG";
import { SVGCircle } from "../svg/SVGCircle";
import { ModeCSS } from "../svg/SVGStyles";
import { SVGText } from "../svg/SVGText";
import { Vector, Obj, LPoint, SVGModes } from "../types";
import { vops } from "../vectorOps";
import { BaseGeometryObject } from "./BaseGeometryObject";

export type PointProps = {
  pt: [number, number];
  label: string;
  showLabel?: boolean;
  offset: Vector;
};

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  private showLabel: boolean;
  private offset: Vector = [3, 3]; // TODO better label placement
  constructor(props: PointProps) {
    super(Obj.Point, {});
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
    this.showLabel = props.showLabel ?? true;
    this.offset = props.offset;
    this.id = this.getId(Obj.Point, this.label);
  }

  labeled = (): LPoint => {
    return { pt: this.pt, label: this.label };
  };

  isEqual = (p: LPoint) => {
    return this.label === p.label && vops.eq(this.pt, p.pt);
  };

  setOffset = (offset: Vector) => {
    this.offset = offset;
  };

  onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.ACTIVETEXT.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    const textId = this.getId(Obj.Text, this.label);
    const ele = document.getElementById(textId);
    console.log("updating point", textId, ele, isActive);
    setStyle(ele);
  };

  svg = (miniScale = false, style?: React.CSSProperties): JSX.Element[] => {
    let svgItems: JSX.Element[] = [
      <SVGCircle
        {...{
          center: this.coordsToSvg(this.pt, miniScale),
          r: 2,
          geoId: this.id,
          style: {
            fill: "black",
            ...style,
          },
          mode: SVGModes.Hidden, // TODO unnecessary rn
          activeFrame: "",
        }}
      />,
    ];
    if (this.showLabel) svgItems.push(this.addLabel(miniScale));
    return svgItems;
  };

  addLabel = (miniScale: boolean, style?: React.CSSProperties) => {
    return (
      <SVGText
        {...{
          point: this.coordsToSvg(this.pt, miniScale, this.offset),
          geoId: this.getId(Obj.Text, this.label),
          text: this.label,
          style: {
            font: "24px serif",
            fontStyle: "italic",
            ...style,
          },
          mode: SVGModes.Default, // TODO unnecessary rn
          activeFrame: "",
        }}
      />
    );
  };
}
