import { ModeCSS } from "../svg/SVGStyles";
import { SVGText } from "../svg/SVGText";
import { LPoint, Obj, SVGModes, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { BaseGeometryObject } from "./BaseGeometryObject";

export type PointProps = {
  pt: [number, number];
  label: string;
  showLabel?: boolean;
  offset: Vector;
  parentFrame?: string;
  hoverable: boolean;
};

export class Point extends BaseGeometryObject {
  // 1 point and label
  public readonly pt: Vector;
  public readonly id: string;
  private showLabel: boolean;
  private offset: Vector = [3, 3]; // TODO better label placement
  constructor(props: PointProps) {
    super(Obj.Point, { hoverable: props.hoverable });
    this.pt = props.pt;
    this.label = props.label;
    this.names = [this.label];
    this.showLabel = props.showLabel ?? true;
    this.offset = props.offset;
    this.id = this.getId(Obj.Point, this.label);
    this.id = props.parentFrame ? `${props.parentFrame}-${this.id}` : this.id;
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
    setStyle(ele);
  };

  svg = (
    pageNum: number,
    parentFrame?: string,
    miniScale = false,
    style?: React.CSSProperties
  ): JSX.Element[] => {
    let svgItems: JSX.Element[] = [];
    // TODO fix point rendering
    //   <SVGCircle
    //     {...{
    //       center: this.coordsToSvg(this.pt, miniScale),
    //       r: 2,
    //       geoId:
    //         parentFrame !== undefined ? `${parentFrame}-${this.id}` : this.id,
    //       style: {
    //         fill: "black",
    //         ...style,
    //       },
    //       mode: SVGModes.Hidden, // TODO unnecessary rn
    //       activeFrame: "",
    //     }}
    //   />,
    // ];
    if (this.showLabel) svgItems.push(this.addLabel(miniScale, pageNum));
    return svgItems;
  };

  addLabel = (
    miniScale: boolean,
    pageNum: number,
    style?: React.CSSProperties
  ) => {
    return (
      <SVGText
        {...{
          point: this.coordsToSvg(this.pt, miniScale, this.offset),
          geoId: this.getId(Obj.Text, this.label),
          text: this.label,
          style: {
            font: "18px serif",
            fontStyle: "italic",
            ...style,
          },
          mode: SVGModes.Default,
          activeFrame: "",
          hoverable: this.hoverable,
        }}
        key={`${this.getId(Obj.Text, this.label)}-${pageNum}`}
      />
    );
  };
}
