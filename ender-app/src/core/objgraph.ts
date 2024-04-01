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
  private points: Point[] = [];
  private segments: Segment[] = [];
  private angles: Angle[] = [];
  private triangles: Triangle[] = [];

  // DOM items, array of SVG elements for each frame
  private frames: Map<string, BaseSVG[]> = new Map();

  addFrame = (name: string, frame: BaseSVG[]) => this.frames.set(name, frame);
  getFrame = (name: string) => this.frames.get(name) || [];

  addContent = (frameKey: string, item: BaseSVG) => {
    let frame = this.getFrame(frameKey);
    if (!frame) {
      console.error("frame not found", frameKey);
      return;
    }
    if (!frame.find((elem) => elem.key === item.key)) {
      this.addFrame(frameKey, frame.concat(item));
    }
  };

  batchAdd = (frameKey: string, items: BaseSVG[]) => {
    items.map((item) => this.addContent(frameKey, item));
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

  // get(name: string, type: Obj.Point): Point;
  // get(name: string, type: Obj.Segment): Segment;
  // get(name: string, type: Obj.Angle): Angle;
  // get(name: string, type: Obj.Triangle): Triangle;
  // get(name: string, type: SupportedObjects) {
  //   switch (type) {
  //     case Obj.Point:
  //       return this.ptByLabel(name);
  //     case Obj.Segment:
  //       return this.segByLabel(name);
  //     case Obj.Angle:
  //       return this.angByLabel(name);
  //     case Obj.Triangle:
  //       return this.triangleByLabel(name);
  //     default:
  //       return;
  //   }
  // }

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
