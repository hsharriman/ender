import React from "react";
import { BaseSVG } from "../svg/BaseSVG";
import { SVGCurve } from "../../../ignore/SVGCurve";
import { SVGLine } from "../svg/SVGLine";
import { SVGPolyline } from "../svg/SVGPolyline";
import { SVGObj } from "../svg/svgTypes";
import { TickType, LSegment, LAngle, Obj, Vector } from "../types";
import { vops } from "../vectorOps";
import { pops } from "../svg/pathBuilderUtils";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { PathSVG } from "../svg/PathSVG";

const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.4;
const SINGLE_MINI_ARC_RADIUS = 0.5;
const SINGLE_MINI_ARC_PADDING = 0.5;
const ARC_PADDING = 0.2;

export type TickProps = {
  type: TickType;
  num: number;
  parent: LSegment | LAngle;
} & BaseGeometryProps;
export class Tick extends BaseGeometryObject {
  // 1 segment and type of tick
  public readonly type: TickType;
  public readonly num: number;
  parent: LSegment | LAngle;
  id: string;
  constructor(props: TickProps) {
    super(props.type, props);
    this.type = props.type;
    this.num = props.num;
    this.parent = props.parent;
    this.id = this.getId(this.type, this.label);
  }

  getLabels = () => {
    return this.id;
  };

  svg = (
    activeFrame: string,
    miniScale = false,
    style?: React.CSSProperties
  ): JSX.Element => {
    // frame-specific render-logic
    if (this.type === Obj.ParallelTick) {
      // makes all parallel ticks at once for 1 segment
      return this.parallelMark(
        this.parent as LSegment,
        activeFrame,
        miniScale,
        style
      );
    } else if (this.type === Obj.EqualLengthTick) {
      return this.equalLength(
        this.parent as LSegment,
        activeFrame,
        miniScale,
        style
      );
    } else if (this.type === Obj.EqualAngleTick) {
      return this.equalAngle(
        this.parent as LAngle,
        activeFrame,
        miniScale,
        style
      );
    }
    return <></>;
  };

  parallelMark = (
    s: LSegment,
    activeFrame: string,
    miniScale = false,
    style?: React.CSSProperties
  ) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);

    let unit = vops.unit(vops.sub(s.p2, s.p1));
    // flip the direction of chevron if unit vec is pointing downwards
    // (in quadrant 3 or 4, where y coord is negative)
    // TODO special case where unit vec is horizontal and pointing left
    if (unit[1] < 0) {
      unit = vops.smul(unit, -1);
    }
    // 2 endpoints of the chevron, rotated to match segment
    const seg = vops.smul(unit, miniScale ? 0.35 : 0.25); // TODO, customize scaling of seg
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(unit, this.num, miniScale);
    let dStr = "";
    tickVectors.map((shift, i) => {
      const polyPts = points.map((v) =>
        this.coordsToSvg(vops.add(v, shift), miniScale)
      );
      dStr =
        dStr +
        pops.moveTo(polyPts[0]) +
        pops.lineTo(polyPts[1]) +
        pops.lineTo(polyPts[2]);
      // build svg polyline of chevron
    });
    this.id = this.getId(Obj.ParallelTick, s.label);
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          modes: this.modes,
          style: style,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  equalLength = (
    s: LSegment,
    activeFrame: string,
    miniScale = false,
    style?: React.CSSProperties
  ) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);
    const unit = vops.unit(vops.sub(s.p2, s.p1));

    // segments to make up the tick mark
    const seg = vops.rot(vops.smul(unit, miniScale ? 0.2 : 0.15), 90);
    const start = vops.add(seg, midpoint);
    const end = vops.add(vops.smul(seg, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    let dStr = "";
    const tickVectors = this.tickPlacement(unit, this.num, miniScale);
    tickVectors.map((shift) => {
      const st = this.coordsToSvg(vops.add(start, shift), miniScale);
      const en = this.coordsToSvg(vops.add(end, shift), miniScale);
      dStr = dStr + pops.moveTo(st) + pops.lineTo(en);
    });
    this.id = this.getId(Obj.ParallelTick, s.label);
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          style: style,
          modes: this.modes,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  equalAngle = (
    a: LAngle,
    activeFrame: string,
    miniScale = false,
    style?: React.CSSProperties
  ) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    let arcR = miniScale || this.num == 1 ? ARC_RADIUS : 0.2;
    let arcPad = miniScale || this.num == 1 ? ARC_PADDING : 0.15;
    if (this.num == 1 && miniScale) {
      arcR = SINGLE_MINI_ARC_RADIUS;
      arcPad = SINGLE_MINI_ARC_PADDING;
    }

    let dStr = "";
    // increase radius according to numticks
    for (let i = 0; i < this.num; i++) {
      const scalar = arcR + arcPad * i;
      const radius = arcR + this.scaleToSvg(arcPad * (i + 1), miniScale);
      const end = this.coordsToSvg(
        vops.add(a.center, vops.smul(eUnit, scalar)),
        miniScale
      );
      const start = this.coordsToSvg(
        vops.add(a.center, vops.smul(sUnit, scalar)),
        miniScale
      );
      dStr = dStr + pops.moveTo(start) + pops.arcTo(radius, 0, sweep, end);
    }
    this.id = this.getId(Obj.EqualAngleTick, a.label);
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          style: style,
          modes: this.modes,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  protected tickPlacement = (
    unit: Vector,
    numTicks: number,
    miniScale: boolean
  ): Vector[] => {
    let dir = 1;
    const even = numTicks % 2 === 0;
    const padding = miniScale ? TICK_PADDING : 0.15;
    let shifts = even ? [padding / 2] : [0];
    for (let i = 1; i < numTicks; i++) {
      if (even && i === 1) dir = -1;
      const shift = i % 2 === 0 ? padding * i * (-1 * dir) : padding * i * dir;
      shifts.push(shifts[i - 1] + shift);
    }
    return shifts.map((shift) => {
      return vops.smul(unit, shift);
    });
  };

  // true if arc should sweep CCW
  // TODO redo so that it automatically looks the smaller angle?
  private arcSweepsCCW = (
    center: Vector,
    start: Vector,
    end: Vector
  ): number => {
    const st = vops.unit(vops.sub(start, center));
    const en = vops.unit(vops.sub(end, center));
    const cross = vops.cross(st, en);
    return cross > 0 ? 0 : 1;
  };
}
