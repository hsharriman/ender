import React from "react";
import { LAngle, LSegment, Obj, TickType, Vector } from "../types/types";
import { vops } from "../vectorOps";
import { pops } from "./pathBuilderUtils";
import { arcSweepsCCW, coordsToSvg, scaleToSvg } from "./svgUtils";

const SINGLE_ARC_RADIUS = 0.55;
const MINI_ARC_R = 0.5;
const SINGLE_MINI_ARC_RADIUS = 0.8;
const MINI_ARC_PADDING = 0.3;
const ARC_PADDING = 0.2;
const PARALLEL_TICK_LEN = (miniScale: boolean) => (miniScale ? 0.6 : 0.35);
const RIGHT_TICK_LEN = (miniScale: boolean) => (miniScale ? 0.5 : 0.3);
const EQ_LEN_TICK_LEN = (miniScale: boolean) => (miniScale ? 0.3 : 0.2);
const TICK_SPACING = (miniScale: boolean) => (miniScale ? 0.3 : 0.25);

export type SVGTickProps = {
  parent: LSegment | LAngle;
  tick?: { type: TickType; num: number };
  css: string;
  miniScale: boolean;
  geoId: string;
};

// Tick should always match the style set by the parent if it is initialized.
// ticks are not interactive and do not need state

export class SVGGeoTick extends React.Component<SVGTickProps> {
  parallelMark = (s: LSegment, num: number) => {
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
    const seg = vops.smul(unit, PARALLEL_TICK_LEN(this.props.miniScale));
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(unit, num, this.props.miniScale);
    let dStr = "";
    tickVectors.map((shift, i) => {
      const polyPts = points.map((v) =>
        coordsToSvg(vops.add(v, shift), this.props.miniScale)
      );
      // build svg polyline of chevron
      dStr =
        dStr +
        pops.moveTo(polyPts[0]) +
        pops.lineTo(polyPts[1]) +
        pops.lineTo(polyPts[2]);
    });
    return dStr;
  };

  equalLength = (s: LSegment, num: number) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);
    const unit = vops.unit(vops.sub(s.p2, s.p1));

    // segments to make up the tick mark
    const seg = vops.rot(
      vops.smul(unit, EQ_LEN_TICK_LEN(this.props.miniScale)),
      90
    );
    const start = vops.add(seg, midpoint);
    const end = vops.add(vops.smul(seg, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    let dStr = "";
    const tickVectors = this.tickPlacement(unit, num, this.props.miniScale);
    tickVectors.map((shift) => {
      const st = coordsToSvg(vops.add(start, shift), this.props.miniScale);
      const en = coordsToSvg(vops.add(end, shift), this.props.miniScale);
      dStr = dStr + pops.moveTo(st) + pops.lineTo(en);
    });
    return dStr;
  };

  equalAngle = (a: LAngle, num: number) => {
    const sweep = arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    // scale start and end by radius per tick
    let arcR = num === 1 ? SINGLE_ARC_RADIUS : 0.35;
    arcR = this.props.miniScale ? MINI_ARC_R : arcR;
    let arcPad =
      this.props.miniScale || num === 1 ? MINI_ARC_PADDING : ARC_PADDING;
    if (num === 1 && this.props.miniScale) {
      arcR = SINGLE_MINI_ARC_RADIUS;
    }

    let dStr = "";
    // increase radius according to num ticks
    for (let i = 0; i < num; i++) {
      const r = arcR + arcPad * i;
      const end = coordsToSvg(
        vops.add(a.center, vops.smul(eUnit, r)),
        this.props.miniScale
      );
      const start = coordsToSvg(
        vops.add(a.center, vops.smul(sUnit, r)),
        this.props.miniScale
      );
      dStr =
        dStr +
        pops.moveTo(start) +
        pops.arcTo(scaleToSvg(r, this.props.miniScale), 0, sweep, end);
    }
    return dStr;
  };

  rightAngle = (a: LAngle) => {
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    const scale = RIGHT_TICK_LEN(this.props.miniScale); // TODO
    const start = coordsToSvg(
      vops.add(a.center, vops.smul(sUnit, scale)),
      this.props.miniScale
    );
    const mid = coordsToSvg(
      vops.add(
        vops.add(vops.smul(sUnit, scale), vops.smul(eUnit, scale)),
        a.center
      ),
      this.props.miniScale
    );
    const end = coordsToSvg(
      vops.add(a.center, vops.smul(eUnit, scale)),
      this.props.miniScale
    );
    return pops.moveTo(start) + pops.lineTo(mid) + pops.lineTo(end); // TODO
  };

  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  protected tickPlacement = (
    unit: Vector,
    numTicks: number,
    miniScale: boolean
  ): Vector[] => {
    let dir = 1;
    const even = numTicks % 2 === 0;
    const padding = TICK_SPACING(miniScale);
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

  render() {
    // frame-specific render-logic
    let pathStr = "";
    if (this.props.tick) {
      if (this.props.tick.type === Obj.ParallelTick) {
        pathStr = this.parallelMark(
          this.props.parent as LSegment,
          this.props.tick.num
        );
      } else if (this.props.tick.type === Obj.EqualLengthTick) {
        pathStr = this.equalLength(
          this.props.parent as LSegment,
          this.props.tick.num
        );
      } else if (this.props.tick.type === Obj.EqualAngleTick) {
        pathStr = this.equalAngle(
          this.props.parent as LAngle,
          this.props.tick.num
        );
      } else if (this.props.tick.type === Obj.RightTick) {
        pathStr = this.rightAngle(this.props.parent as LAngle);
      }
    }
    return pathStr !== "" ? (
      <path
        d={pathStr}
        id={this.props.geoId}
        key={this.props.geoId}
        className={this.props.css + " fill-none"}
      />
    ) : (
      <></>
    );
  }
}
