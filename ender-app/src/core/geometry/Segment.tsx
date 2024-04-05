import { Tick } from "./Tick";
import { BaseSVG } from "../svg/BaseSVG";
import { SVGLine } from "../svg/SVGLine";
import { Obj, LSegment, LPoint, SVGModes, TickType } from "../types";
import { LinkedText } from "../../components/LinkedText";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { Point } from "./Point";
import React from "react";
import { ModeCSS } from "../svg/SVGStyles";

export type SegmentProps = {
  p1: Point;
  p2: Point;
} & BaseGeometryProps;
export class Segment extends BaseGeometryObject {
  // 2 points
  public readonly p1: Point;
  public readonly p2: Point;
  public readonly id: string;
  private ticks: Tick | undefined;
  constructor(props: SegmentProps) {
    super(Obj.Segment, props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.names = this.permutator([this.p1.label, this.p2.label]);
  }
  // deprecated?
  labeled = (): LSegment => {
    return {
      p1: this.p1.pt,
      p2: this.p2.pt,
      label: this.label,
    };
  };

  // deprecated?
  getLabeledPts = (): [LPoint, LPoint] => [this.p1, this.p2];

  tick = (tick: TickType, numTicks: number = 1) => {
    switch (tick) {
      case Obj.ParallelTick:
        return this.parallel(numTicks);
      case Obj.EqualLengthTick:
        return this.equalLengthMark(numTicks);
      case Obj.EqualAngleTick:
        console.error("cannot set angle mark on segment type");
        return this;
      default:
        return this;
    }
  };

  parallel = (numTicks: number) => {
    // TODO
    this.ticks = new Tick({
      type: Obj.ParallelTick,
      num: numTicks,
      parent: this.labeled(),
    });
    return this;
  };

  equalLengthMark = (numTicks: number) => {
    this.ticks = new Tick({
      type: Obj.EqualLengthTick,
      num: numTicks,
      parent: this.labeled(),
    });
    return this;
  };

  onClickText = () => (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.ACTIVE.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
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
  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    let svgItems: JSX.Element[] = [];
    if (this.ticks) {
      svgItems.push(...this.ticks.svg(frameIdx, miniScale, style));
    }
    // add line
    svgItems.push(
      <SVGLine
        {...{
          start: this.coordsToSvg(this.p1.pt, miniScale),
          end: this.coordsToSvg(this.p2.pt, miniScale),
          geoId: this.id,
          style: style,
          modes: this.modes,
          activeFrame: frameIdx,
        }}
      />
    );
    return svgItems;
  };

  linkedText = (label: string) => {
    return (
      <LinkedText
        val={label}
        clickCallback={this.onClickText()}
        type={Obj.Segment}
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

  hideTick = (frameKey: string) => {
    if (this.ticks) {
      this.ticks.mode(frameKey, SVGModes.Hidden);
    }
    return this;
  };
}
