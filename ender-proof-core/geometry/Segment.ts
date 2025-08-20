import { SegmentProps } from "../types/geometryTypes";
import { LSegment, Obj, SVGModes, TickType } from "../types/types";
import { BaseGeometryObject } from "./BaseGeometryObject";
import { Point } from "./Point";

export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  public ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  constructor(props: SegmentProps) {
    super(Obj.Segment, props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.id =
      props.parentFrame !== undefined
        ? `${props.parentFrame}-${this.id}`
        : this.id;
    this.names = this.permutator([this.p1.label, this.p2.label]);
    this.ticks = new Map<string, { type: TickType; num: number }>();
  }

  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  override mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
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
  };

  getTick = (frame: string) => this.ticks.get(frame);

  equals = (other: Segment) => {
    return this.names.has(other.label);
  };

  contains = (pt: Point) => {
    return this.label.includes(pt.label);
  };
}
