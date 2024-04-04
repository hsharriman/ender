import { Obj, LAngle, SVGModes, TickType } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";
import { Tick } from "./Tick";
import { BaseSVG } from "../svg/BaseSVG";

export type AngleProps = {
  start: Point;
  center: Point;
  end: Point;
} & BaseGeometryProps;
export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  private id: string;
  private ticks: Tick | undefined;
  // public rightMarked: boolean;
  constructor(props: AngleProps) {
    super(Obj.Angle, props);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = [
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ];
    this.id = this.getId(Obj.Angle, this.label);
  }

  tick = (tick: TickType, numTicks: number = 1) => {
    switch (tick) {
      case Obj.EqualAngleTick:
        return this.equalAngleMark(numTicks);
      case Obj.ParallelTick:
        console.error(`cannot set ${tick} on angle type`);
        return this;
      case Obj.EqualLengthTick:
        console.error(`cannot set ${tick} on angle type`);
        return this;
      default:
        return this;
    }
  };

  equalAngleMark = (numTicks: number) => {
    this.ticks = new Tick({
      type: Obj.EqualAngleTick,
      num: numTicks,
      parent: this.labeled(),
    });
    return this;
  };

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  svg = (frameIdx: string, style?: React.CSSProperties) => {
    return this.ticks ? this.ticks.svg(frameIdx, style) : [<></>];
  };

  onClickText = (activeColor: string) => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        // TODO change based on mode
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

  override mode = (frameKey: string, mode: SVGModes) => {
    if (this.ticks) {
      this.ticks.mode(frameKey, mode);
    }
    this.modes.set(frameKey, mode);
    return this;
  };
}
