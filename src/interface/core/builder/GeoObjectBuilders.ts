import {
  Angle,
  Circle,
  Point,
  Quadrilateral,
  Segment,
  Triangle,
  Vector,
} from "geometry-object";
import { ShowPoint, SVGModes, TickType } from "../types/diagramTypes";

export class PointBuilder {
  readonly obj: Point;
  readonly offset: Vector;
  readonly modes: Map<string, SVGModes>;
  showPoint: ShowPoint;
  constructor(obj: Point, showPoint?: ShowPoint, offset: Vector = [5, 5]) {
    this.obj = obj;
    this.offset = offset;
    this.modes = new Map<string, SVGModes>();
    this.showPoint = showPoint ?? ShowPoint.Hide;
  }
  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  setShowPoint = (showPoint: ShowPoint) => {
    this.showPoint = showPoint;
    return this;
  };
}
export class SegmentBuilder {
  readonly obj: Segment;
  readonly ticks: Map<string, { type: TickType; num: number }>;
  readonly modes: Map<string, SVGModes>;
  constructor(obj: Segment) {
    this.obj = obj;
    this.ticks = new Map<string, { type: TickType; num: number }>();
    this.modes = new Map<string, SVGModes>();
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
    return this;
  };
}

export class AngleBuilder {
  readonly obj: Angle;
  readonly ticks: Map<string, { type: TickType; num: number }>;
  readonly modes: Map<string, SVGModes>;
  // Value is the mode the gradient was requested under (e.g. ReliesOn renders
  // a different color than Derived) — never Unfocused/Hidden, see addGradient.
  readonly gradients: Map<string, SVGModes>;
  constructor(obj: Angle) {
    this.obj = obj;
    this.ticks = new Map<string, { type: TickType; num: number }>();
    this.modes = new Map<string, SVGModes>();
    this.gradients = new Map<string, SVGModes>();
  }

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
    return this;
  };

  addGradient = (frame: string, mode: SVGModes) => {
    if (mode === SVGModes.Unfocused || mode === SVGModes.Hidden) return this;
    this.gradients.set(frame, mode);
    return this;
  };

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };
}

export class CircleBuilder {
  readonly obj: Circle;
  readonly modes: Map<string, SVGModes>;
  readonly center: PointBuilder;
  constructor(obj: Circle) {
    this.obj = obj;
    this.modes = new Map<string, SVGModes>();
    this.center = new PointBuilder(obj.center);
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };
}

export class TriangleBuilder {
  readonly obj: Triangle;
  readonly modes: Map<string, SVGModes>;
  readonly s: [SegmentBuilder, SegmentBuilder, SegmentBuilder];
  readonly a: [AngleBuilder, AngleBuilder, AngleBuilder];
  rotatePattern: boolean;
  readonly congruent: Set<string> = new Set();
  readonly similar: Set<string> = new Set();
  constructor(obj: Triangle, rotatePattern?: boolean) {
    this.obj = obj;
    this.modes = new Map<string, SVGModes>();
    this.s = [
      new SegmentBuilder(obj.s[0]),
      new SegmentBuilder(obj.s[1]),
      new SegmentBuilder(obj.s[2]),
    ];
    this.a = [
      new AngleBuilder(obj.a[0]),
      new AngleBuilder(obj.a[1]),
      new AngleBuilder(obj.a[2]),
    ];
    this.rotatePattern = rotatePattern ?? false;
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    this.s.forEach((seg) => seg.mode(frameKey, mode));
    this.a.forEach((ang) => ang.mode(frameKey, mode));
    return this;
  };

  labelMode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  setCongruent = (frame: string) => {
    this.congruent.add(frame);
    return this;
  };

  setRotatePattern = (rotate: boolean) => {
    this.rotatePattern = rotate;
    return this;
  };

  setSimilar = (frame: string) => {
    this.similar.add(frame);
    return this;
  };
}

export class QuadrilateralBuilder {
  readonly obj: Quadrilateral;
  readonly modes: Map<string, SVGModes>;
  readonly s: [SegmentBuilder, SegmentBuilder, SegmentBuilder, SegmentBuilder];
  readonly a: [AngleBuilder, AngleBuilder, AngleBuilder, AngleBuilder];
  constructor(obj: Quadrilateral) {
    this.obj = obj;
    this.modes = new Map<string, SVGModes>();
    this.s = [
      new SegmentBuilder(obj.s[0]),
      new SegmentBuilder(obj.s[1]),
      new SegmentBuilder(obj.s[2]),
      new SegmentBuilder(obj.s[3]),
    ];
    this.a = [
      new AngleBuilder(obj.a[0]),
      new AngleBuilder(obj.a[1]),
      new AngleBuilder(obj.a[2]),
      new AngleBuilder(obj.a[3]),
    ];
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    this.s.forEach((seg) => seg.mode(frameKey, mode));
    this.a.forEach((ang) => ang.mode(frameKey, mode));
    return this;
  };
}
