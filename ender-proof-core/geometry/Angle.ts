import { AngleProps } from "../types/geometryTypes";
import { LAngle, Obj, TickType } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";
import { Segment } from "./Segment";

export class Angle extends BaseGeometryObject {
  // need 3 points and concavity/direction
  public readonly start: Point;
  public readonly center: Point;
  public readonly end: Point;
  public id: string;
  public ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  private parentAngle: Angle | null = null;
  constructor(props: AngleProps) {
    super(Obj.Angle, props);
    this.start = props.start;
    this.center = props.center;
    this.end = props.end;
    this.label = `${props.start.label}${props.center.label}${props.end.label}`;
    this.names = new Set([
      `${this.start.label}${this.center.label}${this.end.label}`,
      `${this.end.label}${this.center.label}${this.start.label}`,
    ]);
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

  centerStr = () => {
    return this.center.label;
  };

  // deprecated - DOM manipulation removed for package independence
  override onClickText = (isActive: boolean) => {
    // DOM manipulation removed for package independence
  };

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
    return this;
  };

  inheritTick = (frame: string, prevFrame: string) => {
    this.ticks.get(prevFrame) &&
      this.ticks.set(frame, this.ticks.get(prevFrame)!);
  };

  hideTick = (frame: string) => {
    this.ticks.delete(frame);
    return this;
  };

  getTick = (frame: string) => this.ticks.get(frame);

  equals = (other: Angle) => {
    return this.names.has(other.label);
  };

  contains = (obj: Point | Segment) => {
    if (obj.tag === Obj.Point) {
      return Array.from(this.names).some((name) => name.includes(obj.label));
    } else {
      const segSet = new Set(obj.label.split(""));
      return (
        (segSet.has(this.start.label) || segSet.has(this.end.label)) &&
        segSet.has(this.center.label)
      );
    }
  };

  centerEquals = (pt: Point) => {
    return this.center.isEqualTo(pt);
  };

  addParentAngle = (a: Angle) => {
    this.parentAngle = a;
    return this;
  };

  getParentAngle = () => {
    return this.parentAngle;
  };

  addNames = (start: string, end: string) => {
    this.names.add(`${start}${this.center.label}${end}`);
    this.names.add(`${end}${this.center.label}${start}`);
  };
}
