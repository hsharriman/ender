import React from "react";
import { TickType, LSegment, LAngle, Obj, Vector, SVGModes } from "../types";
import { vops } from "../vectorOps";
import { pops } from "../svg/pathBuilderUtils";
import { BaseGeometryObject, BaseGeometryProps } from "./BaseGeometryObject";
import { PathSVG } from "../svg/PathSVG";
import { ModeCSS } from "../svg/SVGStyles";

const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.3;
const SINGLE_MINI_ARC_RADIUS = 0.4;
const SINGLE_MINI_ARC_PADDING = 0.5;
const RIGHT_ANGLE_SCALE = 0.45;
const ARC_PADDING = 0.2;

export type TickProps = {
  parent: LSegment | LAngle;
  type: TickType;
  num: number;
} & BaseGeometryProps;

export class Tick extends BaseGeometryObject {
  // 1 segment and type of tick
  parent: LSegment | LAngle;
  type: TickType;
  num: number;
  id: string;
  prevFrame: string | undefined;
  constructor(props: TickProps) {
    super(Obj.Tick, props);
    this.parent = props.parent;
    this.type = props.type;
    this.num = props.num;
    this.id = this.getId(this.type, this.parent.label, this.num);
    this.id =
      props.parentFrame !== undefined
        ? `${props.parentFrame}-${this.id}`
        : this.id;
  }

  override onClickText = (isActive: boolean) => {
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        const cls = ModeCSS.ACTIVE.split(" ");
        isActive ? ele.classList.add(...cls) : ele.classList.remove(...cls);
      }
    };
    const ele = document.getElementById(this.id);
    setStyle(ele);
  };

  svg = (
    activeFrame: string,
    miniScale = false,
    style?: React.CSSProperties
  ): JSX.Element => {
    const mode = this.modes.get(activeFrame);
    if (mode) {
      // frame-specific render-logic
      if (this.type === Obj.ParallelTick) {
        // makes all parallel ticks at once for 1 segment
        return this.parallelMark(
          this.parent as LSegment,
          activeFrame,
          mode,
          miniScale,
          style
        );
      } else if (this.type === Obj.EqualLengthTick) {
        return this.equalLength(
          this.parent as LSegment,
          activeFrame,
          mode,
          miniScale,
          style
        );
      } else if (this.type === Obj.EqualAngleTick) {
        return this.equalAngle(
          this.parent as LAngle,
          activeFrame,
          mode,
          miniScale,
          style
        );
      } else if (this.type === Obj.RightTick) {
        return this.rightAngle(
          this.parent as LAngle,
          activeFrame,
          mode,
          miniScale,
          style
        );
      }
    }
    return <></>;
  };

  parallelMark = (
    s: LSegment,
    activeFrame: string,
    mode: SVGModes,
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
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          mode: mode, // TODO tick path modes? might need separate
          style: style,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  equalLength = (
    s: LSegment,
    activeFrame: string,
    mode: SVGModes,
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
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          style: style,
          mode: mode,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  equalAngle = (
    a: LAngle,
    activeFrame: string,
    mode: SVGModes,
    miniScale = false,
    style?: React.CSSProperties
  ) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    let arcR = miniScale || this.num === 1 ? ARC_RADIUS : 0.2;
    arcR = miniScale ? 0.18 : arcR;
    let arcPad = miniScale || this.num === 1 ? ARC_PADDING : 0.15;
    if (this.num === 1 && miniScale) {
      arcR = SINGLE_MINI_ARC_RADIUS;
      arcPad = SINGLE_MINI_ARC_PADDING;
    }

    let dStr = "";
    // increase radius according to numticks
    for (let i = 0; i < this.num; i++) {
      let radius;
      if (i === 0 && this.num > 1) {
        radius = arcR * (i + 1) + this.scaleToSvg(arcPad * (i + 1), miniScale);
      }
      radius = arcR * (i + 1) + this.scaleToSvg(arcPad * (i + 1), miniScale);
      const scalar = arcR + arcPad * i;
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
    return (
      <PathSVG
        {...{
          d: dStr,
          geoId: this.id,
          style: style,
          mode: mode,
          activeFrame: activeFrame,
        }}
      />
    );
  };

  rightAngle = (
    a: LAngle,
    activeFrame: string,
    mode: SVGModes,
    miniScale = false,
    style?: React.CSSProperties
  ) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    const scale = miniScale ? 0.3 : 0.2; // TODO
    const start = this.coordsToSvg(
      vops.add(a.center, vops.smul(sUnit, scale)),
      miniScale
    );
    const mid = this.coordsToSvg(
      vops.add(
        vops.add(vops.smul(sUnit, scale), vops.smul(eUnit, scale)),
        a.center
      ),
      miniScale
    );
    const end = this.coordsToSvg(
      vops.add(a.center, vops.smul(eUnit, scale)),
      miniScale
    );
    const dStr = pops.moveTo(start) + pops.lineTo(mid) + pops.lineTo(end); // TODO
    return (
      <PathSVG
        {...{ d: dStr, geoId: this.id, style: style, mode: mode, activeFrame }}
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
}
