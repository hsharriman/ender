import { SVGBuilder } from "../../core/SVGBuilder";
import { Vector, LabeledPoint, LabeledAngle, SVGFlag } from "../../core/types";
import { vops } from "../../core/vectorOps";

const TICK_PADDING = .35; 
const ARC_RADIUS = .4;
const ARC_PADDING = .2;

enum ObjectType {
  Point = "point",
  Segment = "segment",
  Text = "text",
  // Circle,
  EqualAngle = "equalangle",
  // RightAngle,
  ParallelTick = "parallel",
  EqualLengthTick = "equallength",
}

export class EuclideanBuilder extends SVGBuilder {

  getId = (objectType: ObjectType, label: string, tickNumber?: number) => {
    // TODO account for possible names instead of just alphabetizing because this case
    // doesn't work for angles
    const alphabetizedLabel = Array.from(label).sort().toString();
    let id = `${objectType}.${alphabetizedLabel}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  }

  point = (p: LabeledPoint, labeled?: boolean) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Point, p.label);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      this.addCircle({
        center: this.coordsToSvg(p.pt),
        r: 2,
        key: id,
        style: {fill:"black"}
      });
      if (labeled) {
        this.label(p.pt, p.label);
      }
    }
  }

  segment = (p1: LabeledPoint, p2: LabeledPoint) => {
    // TODO check possible names as well as chosen label
    // check current SVG objects by ID
    const id = this.getId(ObjectType.Segment, `${p1.label}${p2.label}`);
    if (!this.getExistingElement(id)) {
      // element not found, add it
      this.addLine({
        start: this.coordsToSvg(p1.pt),
        end: this.coordsToSvg(p2.pt),
        key: id,
        style: { stroke: "black", strokeWidth: "1px" }
      });
    }
  }

  label = (pos: Vector, label: string, offset: Vector = [3, 3]) => {
    this.addText({
      point: this.coordsToSvg(pos, offset),
      key: this.getId(ObjectType.Text, label),
      text: label,
      style: {font: "12px sans-serif"}
    });
  }

  parallelMark = ([p1, p2]: [LabeledPoint, LabeledPoint], numTicks: number) => {
    // find midpoint on segment
    console.log("parallel segment", p1.pt, p2.pt);
    const midpoint = vops.div(vops.add(p1.pt, p2.pt), 2);

    // TODO make direction face "positive direction"?
    // TODO, customize scaling of seg
    // 2 endpoints of the chevron, rotated to match segment
    const unit = vops.unit(vops.sub(p2.pt, p1.pt));
    const seg = vops.smul(unit, 0.5);
    const startDir = vops.add(vops.rot(seg, 135), midpoint);
    const endDir = vops.add(vops.rot(seg, 225), midpoint);

    // if odd number of ticks, start at midpoint 
    const points = [startDir, midpoint, endDir];

    const tickVectors = this.tickPlacement(unit, numTicks);
    tickVectors.map((shift, i) => {
      const polyPts = points.map(v => 
        this.coordsToSvg(vops.add(v, shift))
      );

      // build svg polyline of chevron
      this.addPolyline({
        points: polyPts,
        fill: "none",
        key: this.getId(ObjectType.ParallelTick, `${p1.label}${p2.label}`, i),
        style: {stroke: "black", strokeWidth: "1px"}
      });
    });
  }

  equalLength = ([p1, p2]: [LabeledPoint, LabeledPoint], numTicks: number) => {
    // find midpoint on segment
    const midpoint = vops.div(vops.add(p1.pt, p2.pt), 2);
    const unit = vops.unit(vops.sub(p2.pt, p1.pt));

    // segments to make up the tick mark
    const seg = vops.smul(unit, 0.5);
    const start = vops.add(vops.rot(seg, 90), midpoint);
    const end = vops.add(vops.smul(start, -1), midpoint);

    // add evenly spaced ticks based on numTicks
    const tickVectors = this.tickPlacement(unit, numTicks);
    tickVectors.map((shift, i) => {
      this.addLine({
        start: this.coordsToSvg(vops.add(start, shift)),
        end: this.coordsToSvg(vops.add(end, shift)),
        key: this.getId(ObjectType.EqualLengthTick, `${p1.label}${p2.label}`, i),
        style: {stroke: "black", strokeWidth: "1px"}
      });
    })    
  }

  equalAngle = (a: LabeledAngle, numTicks: number) => {
    const sweep = this.arcSweepsCCW(a.center, a.start, a.end);
    const sUnit = vops.unit(vops.sub(a.start, a.center));
    const eUnit = vops.unit(vops.sub(a.end, a.center));

    // increase radius according to numticks
    for (let i=0; i<numTicks; i++) {
      const scalar = ARC_RADIUS + (ARC_PADDING * i);
      const radius = ARC_RADIUS + this.scaleToSvg(ARC_PADDING * (i + 1));
      this.addCircularArc({
        r: radius,
        end: this.coordsToSvg(vops.add(a.center, vops.smul(eUnit, scalar))),
        start: this.coordsToSvg(vops.add(a.center, vops.smul(sUnit, scalar))),
        majorArc: 0,
        sweep: sweep,
        key: this.getId(ObjectType.EqualAngle, a.label, i),
        style: {stroke: "black", strokeWidth: "1px", fill: "none"},
      });
    }
  }

  triangle = (pts: [LabeledPoint, LabeledPoint, LabeledPoint]) => {
    pts.map(p => this.point(p, true));
    [[pts[0], pts[1]], [pts[1], pts[2]], [pts[0], pts[2]]]
      .forEach(pair => this.segment(pair[0], pair[1]));
  }


  // returns list of vectors for tick marks along direction represented by unit, centered at the origin
  private tickPlacement = (unit: Vector, numTicks: number): Vector[] => {
    let dir = 1;
    const even = numTicks % 2 === 0;
    let shifts = even ? [ TICK_PADDING / 2 ] : [0];
    for (let i=1; i<numTicks; i++) {
      if (even && i === 1) dir = -1;
      const shift =
        i % 2 === 0
          ? (TICK_PADDING * i * (-1 * dir))
          : (TICK_PADDING * i * dir);
      shifts.push(shifts[i - 1] + shift);
    }
    return shifts.map(shift => {
      return vops.smul(unit, shift);
    });
  }

  // true if arc should sweep CCW
  // TODO redo so that it automatically looks the smaller angle?
  private arcSweepsCCW = (center: Vector, start: Vector, end: Vector): SVGFlag => {
    const st = vops.unit(vops.sub(start, center));
    const en = vops.unit(vops.sub(end, center));
    const cross = vops.cross(st, en);
    return cross > 0 ? 0 : 1;
  }
}
