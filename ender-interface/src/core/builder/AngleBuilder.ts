import { Angle, AngleProps, Obj } from "geometry-object";
import { TickType } from "../types/diagramTypes";
import { BaseBuilderObject } from "./BaseObject";

export type AngleBuilderProps = {
  angle: Angle;
} & AngleProps;

export class AngleBuilder extends BaseBuilderObject {
  readonly angle: Angle;
  public ticks: Map<string, { type: TickType; num: number }>; // frame to tick
  constructor(props: AngleBuilderProps) {
    super(Obj.Angle, props);
    this.angle = props.angle;
    this.ticks = new Map<string, { type: TickType; num: number }>();
  }
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
}
