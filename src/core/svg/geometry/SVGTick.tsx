import React from "react";
import {
  LAngle,
  LSegment,
  Obj,
  SVGModes,
  TickType,
  Vector,
} from "../../types/types";
import { vops } from "../../vectorOps";
import { PathSVG } from "../PathSVG";
import { pops } from "../pathBuilderUtils";
import { BaseSVGProps } from "../svgTypes";
import { coordsToSvg, scaleToSvg } from "../svgUtils";

const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.3;
const SINGLE_MINI_ARC_RADIUS = 0.4;
const SINGLE_MINI_ARC_PADDING = 0.5;
const RIGHT_ANGLE_SCALE = 0.45;
const ARC_PADDING = 0.2;

export type SVGTickProps = {
  parent: LSegment | LAngle;
  type: TickType;
  mode: SVGModes;
  num: number;
  miniScale: boolean;
  geoId: string;
} & BaseSVGProps;

// Tick should always match the style set by the parent if it is initialized.
// ticks are not interactive and do not need state

export class SVGTick extends React.Component<SVGTickProps> {
  parallelMark = (s: LSegment) => {
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
    const seg = vops.smul(unit, this.props.miniScale ? 0.35 : 0.25); // TODO, customize scaling of seg
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(
      unit,
      this.props.num,
      this.props.miniScale
    );
    let dStr = "";
    tickVectors.map((shift, i) => {
      const polyPts = points.map((v) =>
        coordsToSvg(vops.add(v, shift), this.props.miniScale)
      );
      dStr =
        dStr +
        pops.moveTo(polyPts[0]) +
        pops.lineTo(polyPts[1]) +
        pops.lineTo(polyPts[2]);
      // build svg polyline of chevron
    });
    return dStr;
  };

  equalLength = (s: LSegment) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(s.p1, s.p2), 2);
    const unit = vops.unit(vops.sub(s.p2, s.p1));

    // segments to make up the tick mark
    const seg = vops.rot(
      vops.smul(unit, this.props.miniScale ? 0.2 : 0.15),
      90
    );
    const start = vops.add(seg, midpoint);
    const end = vops.add(vops.smul(seg, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    let dStr = "";
    const tickVectors = this.tickPlacement(
      unit,
      this.props.num,
      this.props.miniScale
    );
    tickVectors.map((shift) => {
      const st = coordsToSvg(vops.add(start, shift), this.props.miniScale);
      const en = coordsToSvg(vops.add(end, shift), this.props.miniScale);
      dStr = dStr + pops.moveTo(st) + pops.lineTo(en);
    });
    return dStr;
  };

  equalAngle = (a: LAngle) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    let arcR = this.props.miniScale || this.props.num === 1 ? ARC_RADIUS : 0.2;
    arcR = this.props.miniScale ? 0.18 : arcR;
    let arcPad =
      this.props.miniScale || this.props.num === 1 ? ARC_PADDING : 0.15;
    if (this.props.num === 1 && this.props.miniScale) {
      arcR = SINGLE_MINI_ARC_RADIUS;
      arcPad = SINGLE_MINI_ARC_PADDING;
    }

    let dStr = "";
    // increase radius according to numticks
    for (let i = 0; i < this.props.num; i++) {
      let radius;
      if (i === 0 && this.props.num > 1) {
        radius =
          arcR * (i + 1) + scaleToSvg(arcPad * (i + 1), this.props.miniScale);
      }
      radius =
        arcR * (i + 1) + scaleToSvg(arcPad * (i + 1), this.props.miniScale);
      const scalar = arcR + arcPad * i;
      const end = coordsToSvg(
        vops.add(a.center, vops.smul(eUnit, scalar)),
        this.props.miniScale
      );
      const start = coordsToSvg(
        vops.add(a.center, vops.smul(sUnit, scalar)),
        this.props.miniScale
      );
      dStr = dStr + pops.moveTo(start) + pops.arcTo(radius, 0, sweep, end);
    }
    return dStr;
  };

  rightAngle = (a: LAngle) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    const scale = this.props.miniScale ? 0.3 : 0.2; // TODO
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
    const padding = miniScale ? 0.25 : 0.15;
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

  render() {
    // frame-specific render-logic
    let pathStr = "";
    if (this.props.type === Obj.ParallelTick) {
      pathStr = this.parallelMark(this.props.parent as LSegment);
    } else if (this.props.type === Obj.EqualLengthTick) {
      pathStr = this.equalLength(this.props.parent as LSegment);
    } else if (this.props.type === Obj.EqualAngleTick) {
      pathStr = this.equalAngle(this.props.parent as LAngle);
    } else if (this.props.type === Obj.RightTick) {
      pathStr = this.rightAngle(this.props.parent as LAngle);
    }
    return (
      <PathSVG
        {...{ d: pathStr, geoId: this.props.geoId, mode: this.props.mode }}
        key={this.props.geoId}
      />
    );
  }
}
