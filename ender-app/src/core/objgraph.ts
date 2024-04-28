import { getId } from "../utils";
import { Angle } from "./geometry/Angle";
import { Point } from "./geometry/Point";
import { Quadrilateral } from "./geometry/Quadrilateral";
import { Segment } from "./geometry/Segment";
import { Tick } from "./geometry/Tick";
import { Triangle } from "./geometry/Triangle";
import { BaseSVG } from "./svg/BaseSVG";
import { LAngle, LSegment, Obj, TickType } from "./types";

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
  public ticks: Tick[] = [];
  private triangles: Triangle[] = []; // not rendered, just tracking
  private rectangles: Quadrilateral[] = []; // not rendered, just tracking
  private modes: Set<string> = new Set();
  private content: BaseSVG[] = [];
  private deps: Map<string, Set<string>> = new Map();
  getId = getId;

  addContent = (item: BaseSVG) => {
    if (!this.content.find((elem) => elem.geoId === item.geoId)) {
      this.content = this.content.concat(item);
    }
  };

  batchAdd = (items: BaseSVG[]) => {
    items.map((item) => this.addContent(item));
  };

  getExistingElement = (id: string) => {
    const matches = this.content.filter((item) => item.geoId === id);
    if (matches.length > 1) {
      console.log("more than 1 match for id, ", id, matches);
    }
    return matches[0];
  };

  reliesOn = (id: string, deps: string[]) => {
    // adds dependencies from one step to another
    // key is mode, value is array of modes that it depends on
    this.deps.set(id, new Set(deps));
  };

  getReliesOn = () => {
    return this.deps;
  };

  addFrame = (name: string) => {
    this.modes.add(name);
    return name;
  };

  print() {
    console.log({
      points: this.points,
      segments: this.segments,
      angles: this.angles,
      triangles: this.triangles,
    });
  }

  // update(e: Segment): void;
  // update(e: Angle): void;
  // update(e: Triangle): void;
  // update(e: Segment | Angle | Triangle) {
  //   switch (e.tag) {
  //     case Obj.Segment:
  //       let s = this.getSegment(e.label);
  //       if (s) {
  //         this.segments[this.segments.indexOf(s)] = e as Segment;
  //       }
  //       return;
  //     case Obj.Angle:
  //       let a = this.getAngle(e.label);
  //       if (a) {
  //         this.angles[this.angles.indexOf(a)] = e as Angle;
  //       }
  //       return;
  //     case Obj.Triangle:
  //       let t = this.getTriangle(e.label);
  //       if (t) {
  //         this.triangles[this.triangles.indexOf(t)] = e as Triangle;
  //       }
  //       return;
  //     default:
  //       return;
  //   }
  // }

  push(e: Point): Point;
  push(e: Segment): Segment;
  push(e: Angle): Angle;
  push(e: Triangle): Triangle;
  push(e: Quadrilateral): Quadrilateral;
  push(e: Point | Segment | Angle | Triangle | Tick | Quadrilateral) {
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
      case Obj.Quadrilateral:
        if (!this.getQuadrilateral(e.label))
          this.rectangles.push(e as Quadrilateral);
        return e;
      default:
        return;
    }
  }

  pushTick = (
    parent: Segment | Angle,
    type: TickType,
    options?: {
      frame?: string;
      num?: number;
    }
  ) => {
    let numTicks = options?.num || 1;
    const existing = this.getTick(parent, type, options);
    // debugging
    // let id = this.getId(type, parent.labeled().label, numTicks);
    // const hasParent = options?.frame && options.frame !== undefined;
    // if (hasParent) {
    //   id = `${options?.frame}-${id}`;
    // }
    // const existing = this.ticks.filter((t) => t.id === id)[0];
    if (existing) return existing;
    let tick = new Tick({
      parent: parent.labeled(),
      type,
      num: numTicks,
      parentFrame: options?.frame,
    });
    this.ticks.push(tick);
    return tick;
  };

  getPoint = (label: string) => this.points.filter((p) => p.matches(label))[0];
  getSegment = (label: string) =>
    this.segments.filter((s) => s.matches(label))[0];
  getAngle = (label: string) => this.angles.filter((a) => a.matches(label))[0];
  getTriangle = (label: string) =>
    this.triangles.filter((t) => t.matches(label))[0];
  getQuadrilateral = (label: string) =>
    this.rectangles.filter((r) => r.matches(label))[0];

  getTick = (
    parent: Segment | Angle,
    type: TickType,
    options?: { num?: number; frame?: string }
  ) => {
    let numTicks = options?.num || 1;
    let id = this.getId(type, parent.labeled().label, numTicks);
    const hasParent = options?.frame && options.frame !== undefined;
    if (hasParent) {
      id = `${options?.frame}-${id}`;
    }
    const match = this.ticks.filter((t) => t.id === id);
    // if (match.length === 0) { // debugging
    //   const tickStr = this.ticks.map((t) => t.id).join(", ");
    //   console.error("no match for tick", id, "from ticks", tickStr, options);
    // }
    return match[0];
  };

  allSvgElements =
    (mini = false) =>
    (activeFrame: string) => {
      let pts = this.points.flatMap((p) => p.svg());
      let segs = this.segments.flatMap((s) => s.svg(activeFrame, mini));
      let angs = this.angles.flatMap((a) => a.svg(activeFrame, mini));
      let ticks = this.ticks.flatMap((t) => t.svg(activeFrame, mini));
      return pts.concat(segs).concat(angs).concat(ticks);
    };
}
