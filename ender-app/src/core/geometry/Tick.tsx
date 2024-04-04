import React from "react";
import { BaseSVG } from "../svg/BaseSVG";
import { SVGCurve } from "../svg/SVGCurve";
import { SVGLine } from "../svg/SVGLine";
import { SVGPolyline } from "../svg/SVGPolyline";
import { SVGObj } from "../svg/svgTypes";
import { TickType, LSegment, LAngle, Obj, Vector } from "../types";
import { vops } from "../vectorOps";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";

const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.4;
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
  ids: string[];
  id: string;
  constructor(props: TickProps) {
    super(props.type, props);
    this.type = props.type;
    this.num = props.num;
    this.parent = props.parent;
    this.ids = [];
    this.id = this.getId(this.type, this.label);
  }

  getLabels = () => {
    const labels = [];
    for (let i = 0; i < this.num; i++) {
      labels.push(this.getId(this.type, this.parent.label, i));
    }
    // TODO this only works for equalMark and parallel bc angles have different format
    return labels;
  };

  svg = (activeFrame: string, style?: React.CSSProperties): JSX.Element[] => {
    // frame-specific render-logic
    if (this.type === Obj.ParallelTick) {
      // makes all parallel ticks at once for 1 segment
      return this.parallelMark(this.parent as LSegment, activeFrame, style);
    } else if (this.type === Obj.EqualLengthTick) {
      return this.equalLength(this.parent as LSegment, activeFrame, style);
    } else if (this.type === Obj.EqualAngleTick) {
      return this.equalAngle(this.parent as LAngle, activeFrame, style);
    }
    return [];
  };

  parallelMark = (
    s: LSegment,
    activeFrame: string,
    style?: React.CSSProperties
  ) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);

    // TODO make direction face "positive direction"?
    // TODO, customize scaling of seg
    // 2 endpoints of the chevron, rotated to match segment
    const unit = vops.unit(vops.sub(s.p2, s.p1));
    const seg = vops.smul(unit, 0.5);
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(unit, this.num);
    console.log(this.id, this.parent.label, activeFrame, this.modes.keys());

    return tickVectors.map((shift, i) => {
      const polyPts = points.map((v) => this.coordsToSvg(vops.add(v, shift)));
      const id = this.getId(Obj.ParallelTick, s.label, i);
      this.ids.push(id);
      // build svg polyline of chevron
      return (
        <SVGPolyline
          {...{
            points: polyPts,
            key: id,
            modes: this.modes,
            style: style,
            activeFrame: activeFrame,
          }}
        />
      );
    });
  };

  equalLength = (
    s: LSegment,
    activeFrame: string,
    style?: React.CSSProperties
  ) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);
    const unit = vops.unit(vops.sub(s.p2, s.p1));

    // segments to make up the tick mark
    const seg = vops.rot(vops.smul(unit, 0.25), 90);
    const start = vops.add(seg, midpoint);
    const end = vops.add(vops.smul(seg, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    const tickVectors = this.tickPlacement(unit, this.num);
    return tickVectors.map((shift, i) => {
      const id = this.getId(Obj.EqualLengthTick, s.label, i);
      this.ids.push(id);
      return (
        <SVGLine
          {...{
            start: this.coordsToSvg(vops.add(start, shift)),
            end: this.coordsToSvg(vops.add(end, shift)),
            key: id,
            style: style,
            modes: this.modes,
            activeFrame: activeFrame,
          }}
        />
      );
    });
  };

  equalAngle = (
    a: LAngle,
    activeFrame: string,
    style?: React.CSSProperties
  ) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    let ticks = [];
    // increase radius according to numticks
    for (let i = 0; i < this.num; i++) {
      const scalar = ARC_RADIUS + ARC_PADDING * i;
      const radius = ARC_RADIUS + this.scaleToSvg(ARC_PADDING * (i + 1));
      const id = this.getId(Obj.Angle, a.label, i);
      this.ids.push(id);
      ticks.push(
        <SVGCurve
          {...{
            r: radius,
            end: this.coordsToSvg(vops.add(a.center, vops.smul(eUnit, scalar))),
            start: this.coordsToSvg(
              vops.add(a.center, vops.smul(sUnit, scalar))
            ),
            majorArc: 0,
            sweep: sweep,
            key: id,
            modes: this.modes,
            activeFrame: activeFrame,
            style: style,
          }}
        />
      );
    }
    return ticks;
  };

  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  protected tickPlacement = (unit: Vector, numTicks: number): Vector[] => {
    let dir = 1;
    const even = numTicks % 2 === 0;
    let shifts = even ? [TICK_PADDING / 2] : [0];
    for (let i = 1; i < numTicks; i++) {
      if (even && i === 1) dir = -1;
      const shift =
        i % 2 === 0 ? TICK_PADDING * i * (-1 * dir) : TICK_PADDING * i * dir;
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