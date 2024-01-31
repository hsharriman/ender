import { SVGBuilder } from "../../core/svg/SVGBuilder";
import { Vector, LAngle, LPoint, Obj, LSegment } from "../../core/types";
import { vops } from "../../core/vectorOps";

const TICK_PADDING = 0.35;
const ARC_RADIUS = 0.4;
const ARC_PADDING = 0.2;

export class EuclideanBuilder extends SVGBuilder {
  getId = (objectType: Obj, label: string, tickNumber?: number) => {
    if (objectType === Obj.Angle) {
      const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
      label = `${label[1]}-${endPts}`;
    } else {
      label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  };

  point = (p: LPoint, labeled?: boolean, style?: React.CSSProperties) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(Obj.Point, p.label);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      this.addCircle({
        center: this.coordsToSvg(p.pt),
        r: 2,
        key: id,
        style: {
          fill: "black",
          ...style,
        },
      });
      if (labeled) {
        this.label(p.pt, p.label);
      }
    }
  };

  segment = (s: LSegment, style?: React.CSSProperties) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(Obj.Segment, s.label);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      this.addLine({
        start: this.coordsToSvg(s.p1),
        end: this.coordsToSvg(s.p2),
        key: id,
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
        },
      });
    }
  };

  label = (
    pos: Vector,
    label: string,
    offset: Vector = [3, 3],
    style?: React.CSSProperties
  ) => {
    this.addText({
      point: this.coordsToSvg(pos, offset),
      key: this.getId(Obj.Text, label),
      text: label,
      style: {
        font: "12px sans-serif",
        ...style,
      },
    });
  };

  parallelMark = (
    s: LSegment,
    numTicks: number,
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

    const tickVectors = this.tickPlacement(unit, numTicks);
    tickVectors.map((shift, i) => {
      const polyPts = points.map((v) => this.coordsToSvg(vops.add(v, shift)));

      // build svg polyline of chevron
      this.addPolyline({
        points: polyPts,
        key: this.getId(Obj.ParallelTick, s.label, i),
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
          fill: "none",
        },
      });
    });
  };

  equalLength = (
    s: LSegment,
    numTicks: number,
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
    const tickVectors = this.tickPlacement(unit, numTicks);
    tickVectors.map((shift, i) => {
      this.addLine({
        start: this.coordsToSvg(vops.add(start, shift)),
        end: this.coordsToSvg(vops.add(end, shift)),
        key: this.getId(Obj.EqualLengthTick, s.label, i),
        style: {
          stroke: "black",
          strokeWidth: "1px",
          ...style,
        },
      });
    });
  };

  equalAngle = (a: LAngle, numTicks: number, style?: React.CSSProperties) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    // increase radius according to numticks
    for (let i = 0; i < numTicks; i++) {
      const scalar = ARC_RADIUS + ARC_PADDING * i;
      const radius = ARC_RADIUS + this.scaleToSvg(ARC_PADDING * (i + 1));
      this.addCircularArc({
        r: radius,
        end: this.coordsToSvg(vops.add(a.center, vops.smul(eUnit, scalar))),
        start: this.coordsToSvg(vops.add(a.center, vops.smul(sUnit, scalar))),
        majorArc: 0,
        sweep: sweep,
        key: this.getId(Obj.Angle, a.label, i),
        style: {
          stroke: "black",
          strokeWidth: "1px",
          fill: "none",
          ...style,
        },
      });
    }
  };

  triangle = (pts: LPoint[], segs: LSegment[]) => {
    pts.map((p) => this.point(p, true));
    segs.map((s) => this.segment(s));
  };

  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  private tickPlacement = (unit: Vector, numTicks: number): Vector[] => {
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
