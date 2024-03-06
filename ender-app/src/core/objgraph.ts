import { Point, Segment, Angle, Triangle } from "./geometry";
import { Obj } from "./types";

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle;
export class Content {
  private points: Point[] = [];
  private segments: Segment[] = [];
  private angles: Angle[] = [];
  private triangles: Triangle[] = [];

  print() {
    console.log({
      points: this.points,
      segments: this.segments,
      angles: this.angles,
      triangles: this.triangles,
    });
  }

  get(name: string, type: Obj.Point): Point;
  get(name: string, type: Obj.Segment): Segment;
  get(name: string, type: Obj.Angle): Angle;
  get(name: string, type: Obj.Triangle): Triangle;
  get(name: string, type: SupportedObjects) {
    switch (type) {
      case Obj.Point:
        return this.ptByLabel(name);
      case Obj.Segment:
        return this.segByLabel(name);
      case Obj.Angle:
        return this.angByLabel(name);
      case Obj.Triangle:
        return this.triangleByLabel(name);
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
        if (!this.ptByLabel(e.label)) this.points.push(e as Point);
        return e;
      case Obj.Segment:
        if (!this.segByLabel(e.label)) this.segments.push(e as Segment);
        return e;
      case Obj.Angle:
        if (!this.angByLabel(e.label)) this.angles.push(e as Angle);
        return e;
      case Obj.Triangle:
        // add segments
        if (!this.triangleByLabel(e.label)) this.triangles.push(e as Triangle);
        return e;
      // add angles
      default:
        return;
    }
  }

  ptByLabel = (label: string) => this.points.filter((p) => p.matches(label))[0];
  segByLabel = (label: string) =>
    this.segments.filter((s) => s.matches(label))[0];
  angByLabel = (label: string) =>
    this.angles.filter((a) => a.matches(label))[0];
  triangleByLabel = (label: string) =>
    this.triangles.filter((t) => t.matches(label))[0];
}
