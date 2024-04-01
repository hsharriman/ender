import { Obj, LAngle } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
import { Tick } from "./Tick";

export type AngleProps = {
  start: Point;
  center: Point;
  end: Point;
};
export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  public readonly s1: Segment;
  public readonly s2: Segment;
  private id: string;
  private ticks: Tick | undefined;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(Obj.Angle);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.s1 = new Segment({ p1: props.start, p2: props.center });
    this.s2 = new Segment({ p1: props.center, p2: props.end });
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = [
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ];
    this.id = this.getId(Obj.Angle, this.label);
  }

  equalAngleMark = (numTicks: number, frameIdx: number) => {
    this.ticks = new Tick({
      type: Obj.EqualAngleTick,
      num: numTicks,
      start: frameIdx,
      parent: this.labeled(),
    });
    return this.ticks.svg(frameIdx);
  };

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    // update style for each tick mark
    if (this.ticks) {
      this.ticks.getLabels().map((id) => {
        setStyle(document.getElementById(id));
      });
    }
    [this.s1, this.s2].map((seg) => {
      const ele = document.getElementById(seg.id);
      setStyle(ele);
    });
  };

  linkedText = (label: string) => {
    const DEFAULT_COLOR = "#9A76FF";
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText(DEFAULT_COLOR)}
        type={Obj.Angle}
      />
    );
  };
}
