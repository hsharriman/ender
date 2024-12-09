import { LSegment, Obj, SVGModes, TickType } from "../types/types";
import { permutator } from "../utils";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";

export type SegmentProps = {
  p1: Point;
  p2: Point;
} & BaseGeometryProps;
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
    this.names = permutator([this.p1.label, this.p2.label]);
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

  // deprecated
  // TODO used in linkedText, needs a better location? Could just put in linkedText if linkedText knows the id
  override onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = [""];

        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    };
    const ele = document.getElementById(this.id);
    const eleTick = document.getElementById(`${this.id}-tick`);
    setStyle(ele);
    setStyle(eleTick);
  };
}
