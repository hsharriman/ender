import { SVGLine } from "../svg/SVGLine";
import { Obj, LSegment, LPoint, SVGModes, TickType } from "../types";
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
  // private ticks: Tick;
  constructor(props: SegmentProps) {
    super(Obj.Segment, props);
    this.p1 = props.p1;
    this.p2 = props.p2;
    this.label = `${this.p1.label}${this.p2.label}`;
    this.id = this.getId(Obj.Segment, this.label);
    this.names = this.permutator([this.p1.label, this.p2.label]);
    // this.ticks = new Tick({ parent: this.labeled() });
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

  // private tick = (
  //   frameKey: string,
  //   tick: TickType,
  //   mode: SVGModes,
  //   numTicks: number = 1
  // ) => {
  //   switch (tick) {
  //     case Obj.ParallelTick:
  //       return this.parallel(frameKey, mode, numTicks);
  //     case Obj.EqualLengthTick:
  //       return this.equalLengthMark(frameKey, mode, numTicks);
  //     case Obj.EqualAngleTick:
  //       console.error("cannot set angle mark on segment type");
  //       return this;
  //     default:
  //       return this;
  //   }
  // };

  // parallel = (frameKey: string, mode: SVGModes, numTicks: number) => {
  //   this.ticks.addTickMeta(frameKey, {
  //     // frame key needs to be included
  //     type: Obj.ParallelTick,
  //     num: numTicks,
  //     mode: mode, // Mode needs to be set correctly
  //     id: this.id, // id needs to be generated correctly
  //   }); // TODO
  //   return this;
  // };

  // equalLengthMark = (frameKey: string, mode: SVGModes, numTicks: number) => {
  //   this.ticks.addTickMeta(frameKey, {
  //     type: Obj.EqualLengthTick,
  //     num: numTicks,
  //     mode: mode,
  //     id: this.id,
  //   });
  //   return this;
  // };

  override onClickText = (isActive: boolean) => {
    console.log("updating segment", this.id);
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.ACTIVE.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    const ele = document.getElementById(this.id);
    setStyle(ele);
    // TODO readd functionality
    // const tickLabel = this.ticks.getLabels(active);
    // if (tickLabel) {
    //   const tickEle = document.getElementById(tickLabel);
    //   setStyle(tickEle);
    // }
  };

  //Does not check whether the object already exists in DOM, just returns the SVG
  svg = (frameIdx: string, miniScale = false, style?: React.CSSProperties) => {
    let svgItems: JSX.Element[] = [];
    // if (this.ticks) {
    // svgItems.push(this.ticks.svg(frameIdx, miniScale, style));
    // }
    // add line
    svgItems.push(
      <SVGLine
        {...{
          start: this.coordsToSvg(this.p1.pt, miniScale),
          end: this.coordsToSvg(this.p2.pt, miniScale),
          geoId: this.id,
          style: style,
          mode: this.modes.get(frameIdx) ?? SVGModes.Hidden,
          activeFrame: frameIdx,
        }}
      />
    );
    return svgItems;
  };

  // linkedText = (active: string, label: string) => {
  //   return (
  //     <LinkedText
  //       val={label}
  //       clickCallback={this.onClickText(active)}
  //       type={Obj.Segment}
  //     />
  //   );
  // };

  override mode = (
    frameKey: string,
    mode: SVGModes
    // tickType?: TickType,
    // tickNum?: number
  ) => {
    // if (this.ticks) {
    //   this.ticks.mode(frameKey, mode);
    // }
    // if (tickType) {
    //   this.tick(frameKey, tickType, mode, tickNum);
    // }
    this.modes.set(frameKey, mode);
    return this;
  };

  // hideTick = (frameKey: string) => {
  //   this.ticks.addTickMeta(frameKey, {
  //     mode: SVGModes.Hidden,
  //     type: Obj.HiddenTick,
  //     num: 0,
  //     id: "",
  //   });
  //   return this;
  // };
}
