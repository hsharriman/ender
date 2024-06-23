import { Angle } from "./geometry/Angle";
import { Point } from "./geometry/Point";
import { Quadrilateral } from "./geometry/Quadrilateral";
import { Segment } from "./geometry/Segment";
import { Tick } from "./geometry/Tick";
import { Triangle } from "./geometry/Triangle";
import { Obj, TickType } from "./types/types";
import { getId } from "./utils";

export interface DiagramContent {
  points: Point[];
  segments: Segment[]; // every segment tracks its own mode during build
  angles: Angle[];
  ticks: Tick[];
  triangles: Triangle[];
  rectangles: Quadrilateral[];
  frames: string[];
  deps: Map<string, Set<string>>;
}

export type SupportedObjects =
  | Obj.Point
  | Obj.Segment
  | Obj.Angle
  | Obj.Triangle;
export class Content {
  private ctx: DiagramContent;
  constructor() {
    this.ctx = {
      points: [],
      segments: [],
      angles: [],
      ticks: [],
      triangles: [],
      rectangles: [],
      frames: [],
      deps: new Map(),
    };
  }
  // // abstract object tracking
  // public points: Point[] = [];
  // public segments: Segment[] = [];
  // public angles: Angle[] = [];
  // public ticks: Tick[] = [];
  // private triangles: Triangle[] = []; // not rendered, just tracking
  // private rectangles: Quadrilateral[] = []; // not rendered, just tracking
  // private deps: Map<string, Set<string>> = new Map();
  // private ctx: ContentMap = new Map();
  getId = getId;

  reliesOn = (id: string, deps: string[]) => {
    // adds dependencies from one step to another
    // key is mode, value is array of modes that it depends on
    this.ctx.deps.set(id, new Set(deps));
  };

  getReliesOn = () => {
    return this.ctx.deps;
  };

  addFrame = (name: string) => {
    this.ctx.frames.push(name);
    return name;
  };

  getCtx = () => this.ctx;

  print() {
    console.log({
      points: this.ctx.points,
      segments: this.ctx.segments,
      angles: this.ctx.angles,
      triangles: this.ctx.triangles,
    });
  }

  push(e: Point): Point;
  push(e: Segment): Segment;
  push(e: Angle): Angle;
  push(e: Triangle): Triangle;
  push(e: Quadrilateral): Quadrilateral;
  push(e: Point | Segment | Angle | Triangle | Tick | Quadrilateral) {
    switch (e.tag) {
      case Obj.Point:
        if (!this.getPoint(e.label)) this.ctx.points.push(e as Point);
        return e;
      case Obj.Segment:
        if (!this.getSegment(e.label)) this.ctx.segments.push(e as Segment);
        return e;
      case Obj.Angle:
        if (!this.getAngle(e.label)) this.ctx.angles.push(e as Angle);
        return e;
      case Obj.Triangle:
        // add segments
        if (!this.getTriangle(e.label)) this.ctx.triangles.push(e as Triangle);
        return e;
      // add angles
      case Obj.Quadrilateral:
        if (!this.getQuadrilateral(e.label))
          this.ctx.rectangles.push(e as Quadrilateral);
        return e;
      default:
        return;
    }
  }

  pushTick = (
    parent: Segment | Angle,
    frame: string,
    type: TickType,
    num: number = 1
  ) => {
    // get current frame, get previous frame
    parent.addTick(frame, type, num);
    // const existing = this.getTick(parent, type, options);
    // debugging
    // let id = this.getId(type, parent.labeled().label, numTicks);
    // const hasParent = options?.frame && options.frame !== undefined;
    // if (hasParent) {
    //   id = `${options?.frame}-${id}`;
    // }
    // const existing = this.ticks.filter((t) => t.id === id)[0];
    // if (existing) return existing;
    // let tick = new Tick({
    //   parent: parent.labeled(),
    //   type,
    //   num: numTicks,
    //   parentFrame: options?.frame,
    //   hoverable: false,
    // });
    // this.ctx.ticks.push(tick);
    // return tick;
  };

  getPoint = (label: string) =>
    this.ctx.points.filter((p) => p.matches(label))[0];
  getSegment = (label: string) =>
    this.ctx.segments.filter((s) => s.matches(label))[0];
  getAngle = (label: string) =>
    this.ctx.angles.filter((a) => a.matches(label))[0];
  getTriangle = (label: string) =>
    this.ctx.triangles.filter((t) => t.matches(label))[0];
  getQuadrilateral = (label: string) =>
    this.ctx.rectangles.filter((r) => r.matches(label))[0];

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
    const match = this.ctx.ticks.filter((t) => t.id === id);
    // if (match.length === 0) { // debugging
    //   const tickStr = this.ticks.map((t) => t.id).join(", ");
    //   console.error("no match for tick", id, "from ticks", tickStr, options);
    // }
    return match[0];
  };

  // allSvgElements =
  //   (pageNum: number, mini = false) =>
  //   (activeFrame: string) => {
  //     let pts = this.ctx.points.flatMap((p) => p.svg(pageNum));
  //     let segs = this.ctx.segments.flatMap((s) =>
  //       s.svg(activeFrame, pageNum, mini)
  //     );
  //     // let angs = this.angles.flatMap((a) => a.svg(activeFrame, mini));
  //     let ticks = this.ctx.ticks.flatMap((t) =>
  //       t.svg(activeFrame, pageNum, mini)
  //     );
  //     return pts.concat(segs).concat(ticks);
  //   };

  // allStaticSvgElements = (pageNum: number) => {
  //   let pts = this.ctx.points.flatMap((p) => p.svg(pageNum));
  //   let segs = this.ctx.segments.flatMap((s) =>
  //     s.svg(GIVEN_ID, pageNum, false)
  //   );
  //   // let angs = this.angles.flatMap((a) => a.svg(GIVEN_ID, false));
  //   return pts.concat(segs);
  // };
}
