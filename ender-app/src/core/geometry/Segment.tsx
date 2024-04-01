import { Tick } from "./Tick";
import { BaseSVG } from "../svg/BaseSVG";
import { SVGLine } from "../svg/SVGLine";
import { Obj, LSegment, LPoint } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";

export type SegmentProps = {
  p1: Point;
  p2: Point;
};
export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  private ticks: Tick | undefined;
  constructor(props: SegmentProps) {
    super(Obj.Segment);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.names = this.permutator([this.p1.label, this.p2.label]);
  }

  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  getLabeledPts = (): [LPoint, LPoint] => [this.p1, this.p2];

  parallel = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.ParallelTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  equalLengthMark = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.EqualLengthTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    const ele = document.getElementById(this.id);
    setStyle(ele);
    if (this.ticks)
      this.ticks.getLabels().map((id) => {
        setStyle(document.getElementById(id));
      });
  };

  //Does not check whether the object already exists in DOM, just returns the SVG
  svg = (frameIdx: number, style?: React.CSSProperties) => {
    let svgItems: BaseSVG[] = [];
    if (this.ticks) {
      svgItems.push(...this.ticks.svg(frameIdx, style));
    }
    // add points
    svgItems.push(...this.p1.svg());
    svgItems.push(...this.p2.svg());
    // add line
    svgItems.push(
      new SVGLine({
        start: this.coordsToSvg(this.p1.pt),
        end: this.coordsToSvg(this.p2.pt),
        key: this.id,
        style: {
          ...style,
          stroke: "black",
          strokeWidth: "2px",
        },
      })
    );
    return svgItems;
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Segment}
      />
    );
  };
}
