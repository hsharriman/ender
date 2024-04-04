import { Angle } from "./geometry/Angle";
import { Point } from "./geometry/Point";
import { Segment } from "./geometry/Segment";
import { Triangle } from "./geometry/Triangle";
import { BaseSVG } from "./svg/BaseSVG";
import { Obj } from "./types";

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle;
export class Content {
  // abstract object tracking
  public points: Point[] = [];
  public segments: Segment[] = [];
  public angles: Angle[] = [];
  private triangles: Triangle[] = [];
  private modes: Set<string> = new Set();
  private content: BaseSVG[] = [];

  addContent = (item: BaseSVG) => {
    if (!this.content.find((elem) => elem.key === item.key)) {
      this.content = this.content.concat(item);
    }
  };

  batchAdd = (items: BaseSVG[]) => {
    items.map((item) => this.addContent(item));
  };

  getExistingElement = (id: string) => {
    const matches = this.content.filter((item) => item.key === id);
    if (matches.length > 1) {
      console.log("more than 1 match for id, ", id, matches);
    }
    return matches[0];
  };

  addFrame = (name: string) => {
    this.modes.add(name);
    return name;
  };

  //# from EuclideanBuilder
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

  print() {
    console.log({
      points: this.points,
      segments: this.segments,
      angles: this.angles,
      triangles: this.triangles,
    });
  }

  update(e: Segment): void;
  update(e: Angle): void;
  update(e: Triangle): void;
  update(e: Segment | Angle | Triangle) {
    switch (e.tag) {
      case Obj.Segment:
        let s = this.getSegment(e.label);
        if (s) {
          this.segments[this.segments.indexOf(s)] = e as Segment;
        }
        return;
      case Obj.Angle:
        let a = this.getAngle(e.label);
        if (a) {
          this.angles[this.angles.indexOf(a)] = e as Angle;
        }
        return;
      case Obj.Triangle:
        let t = this.getTriangle(e.label);
        if (t) {
          this.triangles[this.triangles.indexOf(t)] = e as Triangle;
        }
        return;
      default:
        return;
    }
  }

  push(e: Point): Point;
  push(e: Segment): Segment;
  push(e: Angle): Angle;
  push(e: Triangle): Triangle;
  push(e: Point | Segment | Angle | Triangle) {
    switch (e.tag) {
      case Obj.Point:
        if (!this.getPoint(e.label)) this.points.push(e as Point);
        return e;
      case Obj.Segment:
        if (!this.getSegment(e.label)) this.segments.push(e as Segment);
        return e;
      case Obj.Angle:
        if (!this.getAngle(e.label)) this.angles.push(e as Angle);
        return e;
      case Obj.Triangle:
        // add segments
        if (!this.getTriangle(e.label)) this.triangles.push(e as Triangle);
        return e;
      // add angles
      default:
        return;
    }
  }

  getPoint = (label: string) => this.points.filter((p) => p.matches(label))[0];
  getSegment = (label: string) =>
    this.segments.filter((s) => s.matches(label))[0];
  getAngle = (label: string) => this.angles.filter((a) => a.matches(label))[0];
  getTriangle = (label: string) =>
    this.triangles.filter((t) => t.matches(label))[0];
}
