import { Obj, LAngle, SVGModes, TickType } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Tick } from "./Tick";
import { ModeCSS } from "../svg/SVGStyles";

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

  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    return this.ticks ? this.ticks.svg(frameIdx, miniScale, style) : [<></>];
  };

  onClickText = () => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.ACTIVE.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    // update style for each tick mark
    if (this.ticks) {
      setStyle(document.getElementById(this.ticks.getLabels()));
    }
  };

  linkedText = (label: string) => {
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText()}
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
