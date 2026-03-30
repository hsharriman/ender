import {
  Angle,
  Point,
  Quadrilateral,
  Segment,
  Triangle,
  Vector,
} from "geometry-object";
import { ShowPoint, SVGModes, TickType } from "../types/diagramTypes";

// const defaultMode = (
//   frameKey: string,
//   mode: SVGModes,
//   obj: GeoBuilderObject,
// ) => {
//   obj.modes.set(frameKey, mode);
// };

// const defaultAddTick = (
//   frame: string,
//   type: TickType,
//   obj: TickedGeoObject,
//   num: number = 1,
// ) => {
//   obj.ticks.set(frame, { type, num });
// };
// export interface PointBuilder {
//   obj: Point;
//   offset: Vector;
//   modes: Map<string, SVGModes>;
//   showPoint?: ShowPoint;
//   mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
// }

export class PointBuilder {
  readonly obj: Point;
  readonly offset: Vector;
  readonly modes: Map<string, SVGModes>;
  readonly showPoint: ShowPoint;
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
}
// export interface SegmentBuilder {
//   obj: Segment;
//   ticks: Map<string, { type: TickType; num: number }>; // frame to tick
//   modes: Map<string, SVGModes>;
//   mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
//   addTick: (
//     frame: string,
//     type: TickType,
//     obj: TickedGeoObject,
//     num: number,
//   ) => void;
// }

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

// export interface AngleBuilder {
//   obj: Angle;
//   ticks: Map<string, { type: TickType; num: number }>; // frame to tick
//   modes: Map<string, SVGModes>;
//   addTick: (
//     frame: string,
//     type: TickType,
//     obj: TickedGeoObject,
//     num: number,
//   ) => void;
//   mode: (frameKey: string, mode: SVGModes, obj: GeoBuilderObject) => void;
// }

export class AngleBuilder {
  readonly obj: Angle;
  readonly ticks: Map<string, { type: TickType; num: number }>;
  readonly modes: Map<string, SVGModes>;
  constructor(obj: Angle) {
    this.obj = obj;
    this.ticks = new Map<string, { type: TickType; num: number }>();
    this.modes = new Map<string, SVGModes>();
  }

  addTick = (frame: string, type: TickType, num: number = 1) => {
    this.ticks.set(frame, { type, num });
    return this;
  };

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };
}

// export interface TriangleBuilder {
//   obj: Triangle;
//   modes: Map<string, SVGModes>;
//   s: [SegmentBuilder, SegmentBuilder, SegmentBuilder];
//   a: [AngleBuilder, AngleBuilder, AngleBuilder];
//   mode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => void;
//   rotatePattern?: boolean;
//   labelMode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => void;
// }

export class TriangleBuilder {
  readonly obj: Triangle;
  readonly modes: Map<string, SVGModes>;
  readonly s: [SegmentBuilder, SegmentBuilder, SegmentBuilder];
  readonly a: [AngleBuilder, AngleBuilder, AngleBuilder];
  readonly rotatePattern: boolean;
  readonly congruent: Set<string> = new Set();
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
}

// export interface QuadrilateralBuilder {
//   obj: Quadrilateral;
//   modes: Map<string, SVGModes>;
//   s: [SegmentBuilder, SegmentBuilder, SegmentBuilder, SegmentBuilder];
//   a: [AngleBuilder, AngleBuilder, AngleBuilder, AngleBuilder];
//   mode: (frameKey: string, mode: SVGModes, obj: QuadrilateralBuilder) => void;
// }

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

// export const pointBuilder = (
//   obj: Point,
//   offset: Vector = [5, 5],
//   showPoint: ShowPoint = ShowPoint.Hide,
// ): PointBuilder => {
//   return {
//     obj,
//     offset,
//     modes: new Map<string, SVGModes>(),
//     showPoint,
//     mode: defaultMode,
//   };
// };

// export const segmentBuilder = (obj: Segment): SegmentBuilder => {
//   return {
//     obj,
//     ticks: new Map<string, { type: TickType; num: number }>(),
//     modes: new Map<string, SVGModes>(),
//     mode: defaultMode,
//     addTick: defaultAddTick,
//   };
// };

// export const angleBuilder = (obj: Angle): AngleBuilder => {
//   return {
//     obj,
//     ticks: new Map<string, { type: TickType; num: number }>(),
//     modes: new Map<string, SVGModes>(),
//     addTick: defaultAddTick,
//     mode: defaultMode,
//   };
// };

// export const triangleBuilder = (obj: Triangle): TriangleBuilder => {
//   return {
//     obj,
//     modes: new Map<string, SVGModes>(),
//     s: [
//       segmentBuilder(obj.s[0]),
//       segmentBuilder(obj.s[1]),
//       segmentBuilder(obj.s[2]),
//     ],
//     a: [angleBuilder(obj.a[0]), angleBuilder(obj.a[1]), angleBuilder(obj.a[2])],
//     mode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => {
//       obj.modes.set(frameKey, mode);
//       // cascading update the segments and angles
//       obj.s.map((seg) => seg.mode(frameKey, mode, seg));
//       obj.a.map((ang) => ang.mode(frameKey, mode, ang));
//       return this;
//     },
//     labelMode: (frameKey: string, mode: SVGModes, obj: TriangleBuilder) => {
//       obj.modes.set(frameKey, mode);
//     },
//   };
// };

// export const quadrilateralBuilder = (
//   obj: Quadrilateral,
// ): QuadrilateralBuilder => {
//   return {
//     obj,
//     modes: new Map<string, SVGModes>(),
//     s: [
//       segmentBuilder(obj.s[0]),
//       segmentBuilder(obj.s[1]),
//       segmentBuilder(obj.s[2]),
//       segmentBuilder(obj.s[3]),
//     ],
//     a: [
//       angleBuilder(obj.a[0]),
//       angleBuilder(obj.a[1]),
//       angleBuilder(obj.a[2]),
//       angleBuilder(obj.a[3]),
//     ],
//     mode: (frameKey: string, mode: SVGModes, quad: QuadrilateralBuilder) => {
//       quad.modes.set(frameKey, mode);
//       // cascading update the segments and angles
//       quad.s.forEach((seg) => seg.mode(frameKey, mode, seg));
//       quad.a.forEach((ang) => ang.mode(frameKey, mode, ang));
//     },
//   };
// };
