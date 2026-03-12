import { Obj, Segment, SegmentProps } from "geometry-object";
import { SVGModes, TickType } from "../types/diagramTypes";
import { BaseBuilderObject } from "./BaseObject";

export type SegmentBuilderProps = {
  segment: Segment;
} & SegmentProps;

export class SegmentBuilder extends BaseBuilderObject {
  public ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  readonly segment: Segment;
  constructor(props: SegmentBuilderProps) {
    super(Obj.Segment, props);
    this.segment = props.segment;

    this.ticks = new Map<string, { type: TickType; num: number }>();
  }

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
}
