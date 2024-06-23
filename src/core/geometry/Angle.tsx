import { LAngle, Obj, TickType } from "../types/types";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";

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
  public id: string;
  private ticks: Map<string, { type: TickType; num: number }>; // frame to tick
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
    this.ticks = new Map<string, { type: TickType; num: number }>();
  }

  labeled = (): LAngle => {
    return {
      start: this.start.pt,
      center: this.center.pt,
      end: this.end.pt,
      label: this.label,
    };
  };

  getMode = (frameKey: string) => this.modes.get(frameKey);

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
  };

  inheritTick = (frame: string, prevFrame: string) => {
    this.ticks.get(prevFrame) &&
      this.ticks.set(frame, this.ticks.get(prevFrame)!);
  };

  hideTick = (frame: string) => {
    this.ticks.delete(frame);
  };

  getTick = (frame: string) => this.ticks.get(frame);

  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    // TODO?
    return <></>;
  };
}
